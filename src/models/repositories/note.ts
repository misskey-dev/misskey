import { EntityRepository, Repository, In } from 'typeorm';
import { Note } from '../entities/note';
import { User } from '../entities/user';
import { Emojis, Users, PollVotes, DriveFiles, NoteReactions, Followings, Polls, Channels } from '..';
import { ensure } from '../../prelude/ensure';
import { SchemaType } from '../../misc/schema';
import { awaitAll } from '../../prelude/await-all';
import { convertLegacyReaction, convertLegacyReactions, decodeReaction } from '../../misc/reaction-lib';
import { toString } from '../../mfm/to-string';
import { parse } from '../../mfm/parse';
import { Emoji } from '../entities/emoji';
import { concat } from '../../prelude/array';

export type PackedNote = SchemaType<typeof packedNoteSchema>;

@EntityRepository(Note)
export class NoteRepository extends Repository<Note> {
	public validateCw(x: string) {
		return x.trim().length <= 100;
	}

	private async hideNote(packedNote: PackedNote, meId: User['id'] | null) {
		let hide = false;

		// visibility が specified かつ自分が指定されていなかったら非表示
		if (packedNote.visibility === 'specified') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else {
				// 指定されているかどうか
				const specified = packedNote.visibleUserIds!.some((id: any) => meId === id);

				if (specified) {
					hide = false;
				} else {
					hide = true;
				}
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (packedNote.visibility === 'followers') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else if (packedNote.reply && (meId === (packedNote.reply as PackedNote).userId)) {
				// 自分の投稿に対するリプライ
				hide = false;
			} else if (packedNote.mentions && packedNote.mentions.some(id => meId === id)) {
				// 自分へのメンション
				hide = false;
			} else {
				// フォロワーかどうか
				const following = await Followings.findOne({
					followeeId: packedNote.userId,
					followerId: meId
				});

				if (following == null) {
					hide = true;
				} else {
					hide = false;
				}
			}
		}

		if (hide) {
			packedNote.visibleUserIds = undefined;
			packedNote.fileIds = [];
			packedNote.files = [];
			packedNote.text = null;
			packedNote.poll = undefined;
			packedNote.cw = null;
			packedNote.isHidden = true;
		}
	}

	public async pack(
		src: Note['id'] | Note,
		me?: User['id'] | User | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		}
	): Promise<PackedNote> {
		const opts = Object.assign({
			detail: true,
			skipHide: false
		}, options);

		const meId = me ? typeof me === 'string' ? me : me.id : null;
		const note = typeof src === 'object' ? src : await this.findOne(src).then(ensure);
		const host = note.userHost;

		async function populatePoll() {
			const poll = await Polls.findOne(note.id).then(ensure);
			const choices = poll.choices.map(c => ({
				text: c,
				votes: poll.votes[poll.choices.indexOf(c)],
				isVoted: false
			}));

			if (poll.multiple) {
				const votes = await PollVotes.find({
					userId: meId!,
					noteId: note.id
				});

				const myChoices = votes.map(v => v.choice);
				for (const myChoice of myChoices) {
					choices[myChoice].isVoted = true;
				}
			} else {
				const vote = await PollVotes.findOne({
					userId: meId!,
					noteId: note.id
				});

				if (vote) {
					choices[vote.choice].isVoted = true;
				}
			}

			return {
				multiple: poll.multiple,
				expiresAt: poll.expiresAt,
				choices
			};
		}

		/**
		 * 添付用emojisを解決する
		 * @param emojiNames Note等に添付されたカスタム絵文字名 (:は含めない)
		 * @param noteUserHost Noteのホスト
		 * @param reactionNames Note等にリアクションされたカスタム絵文字名 (:は含めない)
		 */
		async function populateEmojis(emojiNames: string[], noteUserHost: string | null, reactionNames: string[]) {
			let all = [] as {
				name: string,
				url: string
			}[];

			// カスタム絵文字
			if (emojiNames?.length > 0) {
				const tmp = await Emojis.find({
					where: {
						name: In(emojiNames),
						host: noteUserHost
					},
					select: ['name', 'host', 'url']
				}).then(emojis => emojis.map((emoji: Emoji) => {
					return {
						name: emoji.name,
						url: emoji.url,
					};
				}));

				all = concat([all, tmp]);
			}

			const customReactions = reactionNames?.map(x => decodeReaction(x)).filter(x => x.name);

			if (customReactions?.length > 0) {
				const where = [] as {}[];

				for (const customReaction of customReactions) {
					where.push({
						name: customReaction.name,
						host: customReaction.host
					});
				}

				const tmp = await Emojis.find({
					where,
					select: ['name', 'host', 'url']
				}).then(emojis => emojis.map((emoji: Emoji) => {
					return {
						name: `${emoji.name}@${emoji.host || '.'}`,	// @host付きでローカルは.
						url: emoji.url,
					};
				}));
				all = concat([all, tmp]);
			}

			return all;
		}

		async function populateMyReaction() {
			const reaction = await NoteReactions.findOne({
				userId: meId!,
				noteId: note.id,
			});

			if (reaction) {
				return convertLegacyReaction(reaction.reaction);
			}

			return undefined;
		}

		let text = note.text;

		if (note.name && (note.url || note.uri)) {
			text = `【${note.name}】\n${(note.text || '').trim()}\n\n${note.url || note.uri}`;
		}

		const channel = note.channelId
			? note.channel
				? note.channel
				: await Channels.findOne(note.channelId)
			: null;

		const packed = await awaitAll({
			id: note.id,
			createdAt: note.createdAt.toISOString(),
			userId: note.userId,
			user: Users.pack(note.user || note.userId, meId),
			text: text,
			cw: note.cw,
			visibility: note.visibility,
			localOnly: note.localOnly || undefined,
			visibleUserIds: note.visibility === 'specified' ? note.visibleUserIds : undefined,
			viaMobile: note.viaMobile || undefined,
			renoteCount: note.renoteCount,
			repliesCount: note.repliesCount,
			reactions: convertLegacyReactions(note.reactions),
			tags: note.tags.length > 0 ? note.tags : undefined,
			emojis: populateEmojis(note.emojis, host, Object.keys(note.reactions)),
			fileIds: note.fileIds,
			files: DriveFiles.packMany(note.fileIds),
			replyId: note.replyId,
			renoteId: note.renoteId,
			channelId: note.channelId || undefined,
			channel: channel ? {
				id: channel.id,
				name: channel.name,
			} : undefined,
			mentions: note.mentions.length > 0 ? note.mentions : undefined,
			uri: note.uri || undefined,
			url: note.url || undefined,
			_featuredId_: (note as any)._featuredId_ || undefined,
			_prId_: (note as any)._prId_ || undefined,

			...(opts.detail ? {
				reply: note.replyId ? this.pack(note.replyId, meId, {
					detail: false
				}) : undefined,

				renote: note.renoteId ? this.pack(note.renoteId, meId, {
					detail: true
				}) : undefined,

				poll: note.hasPoll ? populatePoll() : undefined,

				...(meId ? {
					myReaction: populateMyReaction()
				} : {})
			} : {})
		});

		if (packed.user.isCat && packed.text) {
			const tokens = packed.text ? parse(packed.text) : [];
			packed.text = toString(tokens, { doNyaize: true });
		}

		if (!opts.skipHide) {
			await this.hideNote(packed, meId);
		}

		return packed;
	}

	public packMany(
		notes: (Note['id'] | Note)[],
		me?: User['id'] | User | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		}
	) {
		return Promise.all(notes.map(n => this.pack(n, me, options)));
	}
}

export const packedNoteSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this Note.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the Note was created on Misskey.'
		},
		text: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		cw: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User',
			optional: false as const, nullable: false as const,
		},
		replyId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		renoteId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		reply: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Note'
		},
		renote: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Note'
		},
		viaMobile: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		isHidden: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		visibility: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		mentions: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id'
			}
		},
		visibleUserIds: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id'
			}
		},
		fileIds: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id'
			}
		},
		files: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'DriveFile'
			}
		},
		tags: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			}
		},
		poll: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
		channelId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		channel: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Channel'
		},
	},
};
