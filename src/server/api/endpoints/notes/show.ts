import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note, { pack } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';

/**
 * Show a note
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
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
