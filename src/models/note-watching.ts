const NoteWatching = db.get<INoteWatching>('noteWatching');
NoteWatching.createIndex('userId');
NoteWatching.createIndex('noteId');
NoteWatching.createIndex(['userId', 'noteId'], { unique: true });
export default NoteWatching;

export interface INoteWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
}
