import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import Note from '../../../../../models/note';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿をお気に入りに登録します。',
		'en-US': 'Favorite a note.'
	},

	requireCredential: true,

	kind: 'favorite-write',

	params: {
		noteId: $.type(ID).note({
			desc: {
				'ja-JP': '対象の投稿のID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Get favoritee
	const note = await Note.findOne({
		_id: ps.noteId
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
