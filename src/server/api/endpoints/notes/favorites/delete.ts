/**
 * Module dependencies
 */
import $ from 'cafy';
import Favorite from '../../../../../models/favorite';
import Note from '../../../../../models/note';

/**
 * Unfavorite a note
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
	if (noteIdErr) return rej('invalid noteId param');

	// Get favoritee
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// if already favorited
	const exist = await Favorite.findOne({
		noteId: note._id,
		userId: user._id
	});

	if (exist === null) {
		return rej('already not favorited');
	}

	// Delete favorite
	await Favorite.remove({
		_id: exist._id
	});

	// Send response
	res();
});
