import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packApp } from './app';
import { pack as packChannel } from './channel';
import PollVote, { deletePollVote } from './poll-vote';
import Reaction, { deleteNoteReaction } from './note-reaction';
import { pack as packFile } from './drive-file';
import NoteWatching, { deleteNoteWatching } from './note-watching';
import NoteReaction from './note-reaction';
import Favorite, { deleteFavorite } from './favorite';
import Notification, { deleteNotification } from './notification';

const Note = db.get<INote>('notes');

Note.createIndex('uri', { sparse: true, unique: true });

export default Note;

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

export function isValidCw(text: string): boolean {
	return text.length <= 100 && text.trim() != '';
}

export type INote = {
	_id: mongo.ObjectID;
	channelId: mongo.ObjectID;
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
	visibility: 'public' | 'unlisted' | 'private' | 'direct';
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
	const opts = options || {
		detail: true,
	};

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

	const id = _note._id;

	// Rename _id to id
	_note.id = _note._id;
	delete _note._id;

	delete _note.mentions;
	if (_note.geo) delete _note.geo.type;

	// Populate user
	_note.user = packUser(_note.userId, meId);

	// Populate app
	if (_note.appId) {
		_note.app = packApp(_note.appId);
	}

	// Populate channel
	if (_note.channelId) {
		_note.channel = packChannel(_note.channelId);
	}

	// Populate media
	if (_note.mediaIds) {
		_note.media = Promise.all(_note.mediaIds.map(fileId =>
			packFile(fileId)
		));
	}

	// When requested a detailed note data
	if (opts.detail) {
		// Get previous note info
		_note.prev = (async () => {
			const prev = await Note.findOne({
				userId: _note.userId,
				_id: {
					$lt: id
				}
			}, {
				fields: {
					_id: true
				},
				sort: {
					_id: -1
				}
			});
			return prev ? prev._id : null;
		})();

		// Get next note info
		_note.next = (async () => {
			const next = await Note.findOne({
				userId: _note.userId,
				_id: {
					$gt: id
				}
			}, {
				fields: {
					_id: true
				},
				sort: {
					_id: 1
				}
			});
			return next ? next._id : null;
		})();

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

	return _note;
};
