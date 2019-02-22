import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿をお気に入りに登録します。',
		'en-US': 'Favorite a note.'
	},

	tags: ['favorites'],

	requireCredential: true,

	kind: 'favorite-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '6dd26674-e060-4816-909a-45ba3f4da458'
		},

		alreadyFavorited: {
			message: 'The note has already been marked as a favorite.',
			code: 'ALREADY_FAVORITED',
			id: 'a402c12b-34dd-41d2-97d8-4d2ffd96a1a6'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Get favoritee
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	// if already favorited
	const exist = await Favorite.findOne({
		noteId: note._id,
		userId: user._id
	});

	if (exist !== null) {
		throw new ApiError(meta.errors.alreadyFavorited);
	}

	// Create favorite
	await Favorite.insert({
		createdAt: new Date(),
		noteId: note._id,
		userId: user._id
	});

	return;
});
