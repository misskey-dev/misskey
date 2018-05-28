import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note from '../../../../models/note';
import deleteNote from '../../../../services/note/delete';

/**
 * Delete a note
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Fetch note
	const note = await Note.findOne({
		_id: noteId,
		userId: user._id
	});

	if (note === null) {
		return rej('note not found');
	}

	await deleteNote(user, note);

	res();
});
