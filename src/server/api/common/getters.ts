import * as mongo from 'mongodb';
import Note from "../../../models/note";

/**
 * Get valied note for API processing
 */
export async function getValiedNote(noteId: mongo.ObjectID) {
	const note = await Note.findOne({
		_id: noteId,
		deletedAt: { $exists: false }
	});

	if (note === null) {
		throw 'note not found';
	}

	return note;
}
