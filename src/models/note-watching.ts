import * as mongo from 'mongodb';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';

const NoteWatching = db.get<INoteWatching>('noteWatching');
NoteWatching.createIndex(['userId', 'noteId'], { unique: true });
export default NoteWatching;

export interface INoteWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
}

/**
 * NoteWatchingを物理削除します
 */
export async function deleteNoteWatching(noteWatching: string | mongo.ObjectID | INoteWatching) {
	let n: INoteWatching;

	// Populate
	if (isObjectId(noteWatching)) {
		n = await NoteWatching.findOne({
			_id: noteWatching
		});
	} else if (typeof noteWatching === 'string') {
		n = await NoteWatching.findOne({
			_id: new mongo.ObjectID(noteWatching)
		});
	} else {
		n = noteWatching as INoteWatching;
	}

	if (n == null) return;

	// このNoteWatchingを削除
	await NoteWatching.remove({
		_id: n._id
	});
}
