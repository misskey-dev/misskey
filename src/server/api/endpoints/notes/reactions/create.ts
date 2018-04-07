/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../../../models/note-reaction';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';

/**
 * React to a note
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
	if (noteIdErr) return rej('invalid noteId param');

	// Get 'reaction' parameter
	const [reaction, reactionErr] = $(params.reaction).string().or([
		'like',
		'love',
		'laugh',
		'hmm',
		'surprise',
		'congrats',
		'angry',
		'confused',
		'pudding'
	]).$;
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
