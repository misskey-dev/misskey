import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import Favorite from '../../../../models/favorite';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿の状態を取得します。',
		'en-US': 'Get state of a note.'
	},

	requireCredential: true,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const favorite = await Favorite.count({
		userId: user._id,
		noteId: ps.noteId
	}, {
		limit: 1
	});

	res({
		isFavorited: favorite !== 0
	});
}));
