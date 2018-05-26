import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packApp } from './app';
import PollVote, { deletePollVote } from './poll-vote';
import Reaction, { deleteNoteReaction } from './note-reaction';
import { pack as packFile } from './drive-file';
import NoteWatching, { deleteNoteWatching } from './note-watching';
import NoteReaction from './note-reaction';
import Favorite, { deleteFavorite } from './favorite';
import Notification, { deleteNotification } from './notification';
import Following from './following';

const Note = db.get<INote>('notes');
Note.createIndex('uri', { sparse: true, unique: true });
Note.createIndex('userId');
export default Note;

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

export function isValidCw(text: string): boolean {
	return text.length <= 100;
}

export type INote = {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	mediaIds: mongo.ObjectID[];
	replyId: mongo.ObjectID;
	renoteId: mongo.ObjectID;
	poll: any; // todo
	text: string;
	tags: string[];
	cw: string;
	userId: mongo.ObjectID;
	appId: mongo.ObjectID;
	viaMobile: boolean;
	renoteCount: number;
	repliesCount: number;
	reactionCounts: any;
	mentions: mongo.ObjectID[];

	/**
	 * public ... 公開
	 * home ... ホームタイムライン(ユーザーページのタイムライン含む)のみに流す
	 * followers ... フォロワーのみ
	 * specified ... visibleUserIds で指定したユーザーのみ
	 * private ... 自分のみ
	 */
	visibility: 'public' | 'home' | 'followers' | 'specified' | 'private';

	visibleUserIds: mongo.ObjectID[];

	geo: {
		coordinates: number[];
		altitude: number;
		accuracy: number;
		altitudeAccuracy: number;
		heading: number;
		speed: number;
	};
	uri: string;

	// 非正規化
	_reply?: {
		userId: mongo.ObjectID;
	};
	_renote?: {
		userId: mongo.ObjectID;
	};
	_user: {
		host: string;
		inbox?: string;
	};
};

/**
 * Noteを物理削除します
 */
export async function deleteNote(note: string | mongo.ObjectID | INote) {
	let n: INote;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(note)) {
		n = await Note.findOne({
			_id: note
		});
	} else if (typeof note === 'string') {
		n = await Note.findOne({
			_id: new mongo.ObjectID(note)
		});
	} else {
		n = note as INote;
	}

	console.log(n == null ? `Note: delete skipped ${note}` : `Note: deleting ${n._id}`);

	if (n == null) return;

	// このNoteへの返信をすべて削除
	await Promise.all((
		await Note.find({ replyId: n._id })
	).map(x => deleteNote(x)));

	// このNoteのRenoteをすべて削除
	await Promise.all((
		await Note.find({ renoteId: n._id })
	).map(x => deleteNote(x)));

	// この投稿に対するNoteWatchingをすべて削除
	await Promise.all((
		await NoteWatching.find({ noteId: n._id })
	).map(x => deleteNoteWatching(x)));

	// この投稿に対するNoteReactionをすべて削除
	await Promise.all((
		await NoteReaction.find({ noteId: n._id })
	).map(x => deleteNoteReaction(x)));

	// この投稿に対するPollVoteをすべて削除
	await Promise.all((
		await PollVote.find({ noteId: n._id })
	).map(x => deletePollVote(x)));

	// この投稿に対するFavoriteをすべて削除
	await Promise.all((
		await Favorite.find({ noteId: n._id })
	).map(x => deleteFavorite(x)));

	// この投稿に対するNotificationをすべて削除
	await Promise.all((
		await Notification.find({ noteId: n._id })
	).map(x => deleteNotification(x)));

	// このNoteを削除
	await Note.remove({
		_id: n._id
	});

	console.log(`Note: deleted ${n._id}`);
}

/**
 * Pack a note for API response
 *
 * @param note target
 * @param me? serializee
 * @param options? serialize options
 * @return response
 */
export const pack = async (
	note: string | mongo.ObjectID | INote,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail: boolean
	}
) => {
	const opts = Object.assign({
		detail: true
	}, options);

	// Me
	const meId: mongo.ObjectID = me
		? mongo.ObjectID.prototype.isPrototypeOf(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

	let _note: any;

	// Populate the note if 'note' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(note)) {
		_note = await Note.findOne({
			_id: note
		});
	} else if (typeof note === 'string') {
		_note = await Note.findOne({
			_id: new mongo.ObjectID(note)
		});
	} else {
		_note = deepcopy(note);
	}

	if (!_note) throw `invalid note arg ${note}`;

	let hide = false;

	// visibility が private かつ投稿者のIDが自分のIDではなかったら非表示
	if (_note.visibility == 'private' && (meId == null || !meId.equals(_note.userId))) {
		hide = true;
	}

	// visibility が specified かつ自分が指定されていなかったら非表示
	if (_note.visibility == 'specified') {
		if (meId == null) {
			hide = true;
		} else if (meId.equals(_note.userId)) {
			hide = false;
		} else {
			// 指定されているかどうか
			const specified = _note.visibleUserIds.some(id => id.equals(meId));

			if (specified) {
				hide = false;
			} else {
				hide = true;
			}
		}
	}

	// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
	if (_note.visibility == 'followers') {
		if (meId == null) {
			hide = true;
		} else if (meId.equals(_note.userId)) {
			hide = false;
		} else {
			// フォロワーかどうか
			const following = await Following.findOne({
				followeeId: _note.userId,
				followerId: meId
			});

			if (following == null) {
				hide = true;
			} else {
				hide = false;
			}
		}
	}

	const id = _note._id;

	// Rename _id to id
	_note.id = _note._id;
	delete _note._id;

	delete _note._user;
	delete _note._reply;
	delete _note.repost;
	delete _note.mentions;
	if (_note.geo) delete _note.geo.type;

	// Populate user
	_note.user = packUser(_note.userId, meId);

	// Populate app
	if (_note.appId) {
		_note.app = packApp(_note.appId);
	}

	// Populate media
	_note.media = hide ? [] : Promise.all(_note.mediaIds.map(fileId =>
		packFile(fileId)
	));

	// When requested a detailed note data
	if (opts.detail) {
		//#region 重いので廃止
		_note.prev = null;
		_note.next = null;
		//#endregion

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
		if (meId && _note.poll && !hide) {
			_note.poll = (async (poll) => {
				const vote = await PollVote
					.findOne({
						userId: meId,
						noteId: id
					});

				if (vote != null) {
					const myChoice = poll.choices
						.filter(c => c.id == vote.choice)[0];

					myChoice.isVoted = true;
				}

				return poll;
			})(_note.poll);
		}

		// Fetch my reaction
		if (meId) {
			_note.myReaction = (async () => {
				const reaction = await Reaction
					.findOne({
						userId: meId,
						noteId: id,
						deletedAt: { $exists: false }
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

	if (_note.user.isCat && _note.text) {
		_note.text = _note.text.replace(/な/g, 'にゃ').replace(/ナ/g, 'ニャ');
	}

	if (hide) {
		_note.mediaIds = [];
		_note.text = null;
		_note.poll = null;
		_note.isHidden = true;
	}

	return _note;
};
