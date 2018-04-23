/**
 * Module dependencies
 */
import $ from 'cafy';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';

/**
 * React to a note
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
	if (noteIdErr) return rej('invalid noteId param');

	// Get 'reaction' parameter
	const [reaction, reactionErr] = $(params.reaction).string().pipe(validateReaction.ok).$;
	if (reactionErr) return rej('invalid reaction param');

	// Fetch reactee
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	try {
		await create(user, note, reaction);
	} catch (e) {
		rej(e);
	}

	res();
});
