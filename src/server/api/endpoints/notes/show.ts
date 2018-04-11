/**
 * Module dependencies
 */
import $ from 'cafy';
import Note, { pack } from '../../../../models/note';

/**
 * Show a note
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
	if (noteIdErr) return rej('invalid noteId param');

	// Get note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// Serialize
	res(await pack(note, user, {
		detail: true
	}));
});
