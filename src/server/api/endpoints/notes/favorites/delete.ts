import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿のお気に入りを解除します。',
		'en-US': 'Unfavorite a note.'
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
			id: '80848a2c-398f-4343-baa9-df1d57696c56'
		},

		notFavorited: {
			message: 'You have not marked that note a favorite.',
			code: 'NOT_FAVORITED',
			id: 'b625fc69-635e-45e9-86f4-dbefbef35af5'
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

	if (exist === null) {
		throw new ApiError(meta.errors.notFavorited);
	}

	// Delete favorite
	await Favorite.remove({
		_id: exist._id
	});

	return;
});
