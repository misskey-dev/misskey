import { EntityRepository, Repository, In } from 'typeorm';
import * as mfm from 'mfm-js';
import { Note } from '@/models/entities/note';
import { User } from '@/models/entities/user';
import { Users, PollVotes, DriveFiles, NoteReactions, Followings, Polls, Channels } from '../index';
import { Packed } from '@/misc/schema';
import { nyaize } from '@/misc/nyaize';
import { awaitAll } from '@/prelude/await-all';
import { convertLegacyReaction, convertLegacyReactions, decodeReaction } from '@/misc/reaction-lib';
import { NoteReaction } from '@/models/entities/note-reaction';
import { aggregateNoteEmojis, populateEmojis, prefetchEmojis } from '@/misc/populate-emojis';

@EntityRepository(Note)
export class NoteRepository extends Repository<Note> {
	public validateCw(x: string) {
		return x.trim().length <= 100;
	}

	public async isVisibleForMe(note: Note, meId: User['id'] | null): Promise<boolean> {
		// visibility が specified かつ自分が指定されていなかったら非表示
		if (note.visibility === 'specified') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else {
				// 指定されているかどうか
				const specified = note.visibleUserIds.some((id: any) => meId === id);

				if (specified) {
					return true;
				} else {
					return false;
				}
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (note.visibility === 'followers') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else if (note.reply && (meId === note.reply.userId)) {
				// 自分の投稿に対するリプライ
				return true;
			} else if (note.mentions && note.mentions.some(id => meId === id)) {
				// 自分へのメンション
				return true;
			} else {
				// フォロワーかどうか
				const following = await Followings.findOne({
					followeeId: note.userId,
					followerId: meId
				});

				if (following == null) {
					return false;
				} else {
					return true;
				}
			}
		}

		return true;
	}

	private async hideNote(packedNote: Packed<'Note'>, meId: User['id'] | null) {
		// TODO: isVisibleForMe を使うようにしても良さそう(型違うけど)
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
			} else if (packedNote.reply && (meId === packedNote.reply.userId)) {
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
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
			_hint_?: {
				myReactions: Map<Note['id'], NoteReaction | null>;
			};
		}
	): Promise<Packed<'Note'>> {
		const opts = Object.assign({
			detail: true,
			skipHide: false
		}, options);

		const meId = me ? me.id : null;
		const note = typeof src === 'object' ? src : await this.findOneOrFail(src);
		const host = note.userHost;

		async function populatePoll() {
			const poll = await Polls.findOneOrFail(note.id);
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

		async function populateMyReaction() {
			if (options?._hint_?.myReactions) {
				const reaction = options._hint_.myReactions.get(note.id);
				if (reaction) {
					return convertLegacyReaction(reaction.reaction);
				} else if (reaction === null) {
					return undefined;
				}
				// 実装上抜けがあるだけかもしれないので、「ヒントに含まれてなかったら(=undefinedなら)return」のようにはしない
			}

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

		const reactionEmojiNames = Object.keys(note.reactions).filter(x => x?.startsWith(':')).map(x => decodeReaction(x).reaction).map(x => x.replace(/:/g, ''));

		const packed = await awaitAll({
			id: note.id,
			createdAt: note.createdAt.toISOString(),
			userId: note.userId,
			user: Users.pack(note.user || note.userId, me, {
				detail: false,
			}),
			text: text,
			cw: note.cw,
			visibility: note.visibility,
			localOnly: note.localOnly || undefined,
			visibleUserIds: note.visibility === 'specified' ? note.visibleUserIds : undefined,
			renoteCount: note.renoteCount,
			repliesCount: note.repliesCount,
			reactions: convertLegacyReactions(note.reactions),
			tags: note.tags.length > 0 ? note.tags : undefined,
			emojis: populateEmojis(note.emojis.concat(reactionEmojiNames), host),
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

			...(opts.detail ? {
				reply: note.replyId ? this.pack(note.reply || note.replyId, me, {
					detail: false,
					_hint_: options?._hint_
				}) : undefined,

				renote: note.renoteId ? this.pack(note.renote || note.renoteId, me, {
					detail: true,
					_hint_: options?._hint_
				}) : undefined,

				poll: note.hasPoll ? populatePoll() : undefined,

				...(meId ? {
					myReaction: populateMyReaction()
				} : {})
			} : {})
		});

		if (packed.user.isCat && packed.text) {
			const tokens = packed.text ? mfm.parse(packed.text) : [];
			mfm.inspect(tokens, node => {
				if (node.type === 'text') {
					// TODO: quoteなtextはskip
					node.props.text = nyaize(node.props.text);
				}
			});
			packed.text = mfm.toString(tokens);
		}

		if (!opts.skipHide) {
			await this.hideNote(packed, meId);
		}

		return packed;
	}

	public async packMany(
		notes: Note[],
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		}
	) {
		if (notes.length === 0) return [];

		const meId = me ? me.id : null;
		const myReactionsMap = new Map<Note['id'], NoteReaction | null>();
		if (meId) {
			const renoteIds = notes.filter(n => n.renoteId != null).map(n => n.renoteId!);
			const targets = [...notes.map(n => n.id), ...renoteIds];
			const myReactions = await NoteReactions.find({
				userId: meId,
				noteId: In(targets),
			});

			for (const target of targets) {
				myReactionsMap.set(target, myReactions.find(reaction => reaction.noteId === target) || null);
			}
		}

		await prefetchEmojis(aggregateNoteEmojis(notes));

		return await Promise.all(notes.map(n => this.pack(n, me, {
			...options,
			_hint_: {
				myReactions: myReactionsMap
			}
		})));
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
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
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
			ref: 'User' as const,
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
			ref: 'Note' as const,
		},
		renote: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Note' as const,
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
				ref: 'DriveFile' as const,
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
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					id: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
					name: {
						type: 'string' as const,
						optional: false as const, nullable: true as const,
					},
				},
			},
		},
		localOnly: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		emojis: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					name: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
					url: {
						type: 'string' as const,
						optional: false as const, nullable: true as const,
					},
				},
			},
		},
		reactions: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
		},
		renoteCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		repliesCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		uri: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},
		url: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},

		myReaction: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
	},
};
