import { EntityRepository, Repository, In } from 'typeorm';
import { Note } from '../entities/note';
import { User } from '../entities/user';
import { unique, concat } from '../../prelude/array';
import { nyaize } from '../../misc/nyaize';
import { Emojis, Users, Apps, PollVotes, DriveFiles, NoteReactions, Followings, Polls } from '..';
import rap from '@prezzemolo/rap';

@EntityRepository(Note)
export class NoteRepository extends Repository<Note> {
	public validateCw(x: string) {
		return x.trim().length <= 100;
	}

	private async hideNote(packedNote: any, meId: User['id']) {
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
		me?: User['id'] | User,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		}
	) {
		return Promise.all(notes.map(n => this.pack(n, me, options)));
	}

	public async pack(
		note: Note['id'] | Note,
		me?: User['id'] | User,
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
		const _note = typeof note === 'object' ? note : await this.findOne(note);
		const host = _note.userHost;

		async function populatePoll() {
			const poll = await Polls.findOne({ noteId: _note.id });
			const choices = poll.choices.map(c => ({
				text: c,
				votes: poll.votes[poll.choices.indexOf(c)],
				isVoted: false
			}));

			if (poll.multiple) {
				const votes = await PollVotes.find({
					userId: meId,
					noteId: _note.id
				});

				const myChoices = votes.map(v => v.choice);
				for (const myChoice of myChoices) {
					choices[myChoice].isVoted = true;
				}
			} else {
				const vote = await PollVotes.findOne({
					userId: meId,
					noteId: _note.id
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
				userId: meId,
				noteId: _note.id,
			});

			if (reaction) {
				return reaction.reaction;
			}

			return null;
		}

		let text = _note.text;

		if (_note.name) {
			text = `【${_note.name}】\n${_note.text}`;
		}

		/* v11 TODO
		if (_note.user.isCat && _note.text) {
			text = nyaize(_note.text);
		}
		*/

		const reactionEmojis = unique(concat([_note.emojis, Object.keys(_note.reactions)]));

		const packed = await rap({
			id: _note.id,
			createdAt: _note.createdAt,
			app: _note.appId ? Apps.pack(_note.appId) : null,
			userId: _note.userId,
			user: Users.pack(_note.user || _note.userId, meId),
			text: text,
			reactions: _note.reactions,
			emojis: reactionEmojis.length > 0 ? Emojis.find({
				name: In(reactionEmojis),
				host: host
			}) : [],
			files: DriveFiles.packMany(_note.fileIds),
			replyId: _note.replyId,
			renoteId: _note.renoteId,

			...(opts.detail ? {
				reply: _note.replyId ? this.pack(_note.replyId, meId, {
					detail: false
				}) : null,

				renote: _note.renoteId ? this.pack(_note.renoteId, meId, {
					detail: false
				}) : null,

				poll: _note.hasPoll ? populatePoll() : null,

				...(meId ? {
					myReaction: populateMyReaction()
				} : {})
			} : {})
		});

		if (!opts.skipHide) {
			await this.hideNote(packed, meId);
		}

		return packed;
	}
}
