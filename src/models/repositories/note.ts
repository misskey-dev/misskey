import { EntityRepository, Repository, In } from 'typeorm';
import { Note } from '../entities/note';
import { User } from '../entities/user';
import { unique, concat } from '../../prelude/array';
import { nyaize } from '../../misc/nyaize';
import { Emojis, Users, Apps, PollVotes, DriveFiles, NoteReactions, Followings, Polls } from '..';
import rap from '@prezzemolo/rap';
import { ensure } from '../../prelude/ensure';

@EntityRepository(Note)
export class NoteRepository extends Repository<Note> {
	public validateCw(x: string) {
		return x.trim().length <= 100;
	}

	private async hideNote(packedNote: any, meId: User['id'] | null) {
		let hide = false;

		// visibility が specified かつ自分が指定されていなかったら非表示
		if (packedNote.visibility == 'specified') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else {
				// 指定されているかどうか
				const specified = packedNote.visibleUserIds.some((id: any) => meId === id);

				if (specified) {
					hide = false;
				} else {
					hide = true;
				}
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (packedNote.visibility == 'followers') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else if (packedNote.reply && (meId === packedNote.reply.userId)) {
				// 自分の投稿に対するリプライ
				hide = false;
			} else if (packedNote.mentions && packedNote.mentions.some((id: any) => meId === id)) {
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
			packedNote.visibleUserIds = null;
			packedNote.fileIds = [];
			packedNote.files = [];
			packedNote.text = null;
			packedNote.poll = null;
			packedNote.cw = null;
			packedNote.tags = [];
			packedNote.geo = null;
			packedNote.isHidden = true;
		}
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

	public async pack(
		src: Note['id'] | Note,
		me?: User['id'] | User | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		}
	): Promise<Record<string, any>> {
		const opts = Object.assign({
			detail: true,
			skipHide: false
		}, options);

		const meId = me ? typeof me === 'string' ? me : me.id : null;
		const note = typeof src === 'object' ? src : await this.findOne(src).then(ensure);
		const host = note.userHost;

		async function populatePoll() {
			const poll = await Polls.findOne({ noteId: note.id }).then(ensure);
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
			const reaction = await NoteReactions.findOne({
				userId: meId!,
				noteId: note.id,
			});

			if (reaction) {
				return reaction.reaction;
			}

			return null;
		}

		let text = note.text;

		if (note.name) {
			text = `【${note.name}】\n${note.text}`;
		}

		const reactionEmojis = unique(concat([note.emojis, Object.keys(note.reactions)]));

		const packed = await rap({
			id: note.id,
			createdAt: note.createdAt,
			app: note.appId ? Apps.pack(note.appId) : undefined,
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
			reactions: note.reactions,
			emojis: reactionEmojis.length > 0 ? Emojis.find({
				name: In(reactionEmojis),
				host: host
			}) : [],
			tags: note.tags,
			fileIds: note.fileIds,
			files: DriveFiles.packMany(note.fileIds),
			replyId: note.replyId,
			renoteId: note.renoteId,
			uri: note.uri,

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
			packed.text = nyaize(packed.text);
		}

		if (!opts.skipHide) {
			await this.hideNote(packed, meId);
		}

		return packed;
	}
}
