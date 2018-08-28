import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import Note from '../../../../../models/note';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のお気に入りを解除します。',
		'en-US': 'Unfavorite a note.'
	},

	requireCredential: true,

	kind: 'favorite-write'
};

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
