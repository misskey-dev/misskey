const NoteUnread = db.get<NoteUnread>('noteUnreads');
NoteUnread.createIndex('userId');
NoteUnread.createIndex('noteId');
NoteUnread.createIndex(['userId', 'noteId'], { unique: true });
export default NoteUnread;

export interface NoteUnread {
	id: mongo.ObjectID;
	noteId: mongo.ObjectID;
	userId: mongo.ObjectID;
	isSpecified: boolean;

	_note: {
		userId: mongo.ObjectID;
	};
}
