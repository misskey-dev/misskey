import * as mongo from 'mongodb';
import db from '../db/mongodb';

const NoteUnread = db.get<INoteUnread>('noteUnreads');
NoteUnread.createIndex(['userId', 'noteId'], { unique: true });
export default NoteUnread;

export interface INoteUnread {
	_id: mongo.ObjectID;
	noteId: mongo.ObjectID;
	userId: mongo.ObjectID;
	isSpecified: boolean;

	_note: {
		userId: mongo.ObjectID;
	};
}
