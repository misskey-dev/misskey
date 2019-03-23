import { EntityRepository, Repository } from 'typeorm';
import { Note } from '../entities/note';
import { User } from '../entities/user';

@EntityRepository(Note)
export class NoteRepository extends Repository<Note> {
	private async cloneOrFetch(x: Note['id'] | Note): Promise<Note> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	private async hideNote(packedNote: any, meId: string) {
		let hide = false;

		// visibility が private かつ投稿者のIDが自分のIDではなかったら非表示(後方互換性のため)
		if (packedNote.visibility == 'private' && (meId == null || (meId !== packedNote.userId))) {
			hide = true;
		}

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
	) {
		const opts = Object.assign({
			detail: true,
			skipHide: false
		}, options);

		const meId = typeof me === 'string' ? me : me.id;

		const _note = await this.cloneOrFetch(note);

		const id = _note.id;

		// Some counts
		_note.renoteCount = _note.renoteCount || 0;
		_note.repliesCount = _note.repliesCount || 0;
		_note.reactionCounts = _note.reactionCounts || {};

		// _note._userを消す前か、_note.userを解決した後でないとホストがわからない
		if (_note._user) {
			const host = _note._user.host;

			_note.emojis = unique(concat([_note.emojis, Object.keys(_note.reactionCounts)]));

			_note.emojis = Emoji.find({
				name: { $in: _note.emojis },
				host: host
			}, {
				fields: { _id: false }
			});
		}

		// Rename _id to id
		_note.id = _note.id;
		delete _note.id;

		delete _note.prev;
		delete _note.next;
		delete _note.tagsLower;
		delete _note.score;
		delete _note._user;
		delete _note._reply;
		delete _note._renote;
		delete _note._files;
		delete _note._replyIds;
		delete _note.mentionedRemoteUsers;

		if (_note.geo) delete _note.geo.type;

		// Populate user
		_note.user = packUser(_note.userId, meId);

		// Populate app
		if (_note.appId) {
			_note.app = packApp(_note.appId);
		}

		// Populate files
		_note.files = packFileMany(_note.fileIds || []);

		// 後方互換性のため
		_note.mediaIds = _note.fileIds;
		_note.media = _note.files;

		// When requested a detailed note data
		if (opts.detail) {
			if (_note.replyId) {
				// Populate reply to note
				_note.reply = pack(_note.replyId, meId, {
					detail: false
				});
			}

			if (_note.renoteId) {
				// Populate renote
				_note.renote = pack(_note.renoteId, meId, {
					detail: _note.text == null
				});
			}

			// Poll
			if (meId && _note.poll) {
				_note.poll = (async poll => {
					if (poll.multiple) {
						const votes = await PollVote.find({
							userId: meId,
							noteId: id
						});

						const myChoices = (poll.choices as IChoice[]).filter(x => votes.some(y => x.id == y.choice));
						for (const myChoice of myChoices) {
							(myChoice as any).isVoted = true;
						}

						return poll;
					} else {
						poll.multiple = false;
					}

					const vote = await PollVotes.findOne({
						userId: meId,
						noteId: id
					});

					if (vote) {
						const myChoice = (poll.choices as IChoice[])
							.filter(x => x.id == vote.choice)[0] as any;

						myChoice.isVoted = true;
					}

					return poll;
				})(_note.poll);
			}

			if (meId) {
				// Fetch my reaction
				_note.myReaction = (async () => {
					const reaction = await NoteReactions.findOne({
							userId: meId,
							noteId: id,
						});

					if (reaction) {
						return reaction.reaction;
					}

					return null;
				})();
			}
		}

		// resolve promises in _note object
		_note = await rap(_note);

		if (_note.name) {
			_note.text = `【${_note.name}】\n${_note.text}`;
		}

		if (_note.user.isCat && _note.text) {
			_note.text = nyaize(_note.text);
		}

		if (!opts.skipHide) {
			await this.hideNote(_note, meId);
		}

		return _note;
	}
}
