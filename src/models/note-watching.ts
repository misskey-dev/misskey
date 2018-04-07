import * as mongo from 'mongodb';
import db from '../db/mongodb';

const NoteWatching = db.get<INoteWatching>('noteWatching');
NoteWatching.createIndex(['userId', 'noteId'], { unique: true });
export default NoteWatching;

export interface INoteWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
}
