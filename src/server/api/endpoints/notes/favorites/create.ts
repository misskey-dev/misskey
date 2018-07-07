import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import Note from '../../../../../models/note';
import { ILocalUser } from '../../../../../models/user';

/**
 * Favorite a note
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
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

	if (exist !== null) {
		return rej('already favorited');
	}

	// Create favorite
	await Favorite.insert({
		createdAt: new Date(),
		noteId: note._id,
		userId: user._id
	});

	// Send response
	res();
});
