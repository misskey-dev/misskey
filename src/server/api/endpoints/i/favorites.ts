import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Favorite, { packMany } from '../../../../models/note-favorite';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'お気に入りに登録した投稿一覧を取得します。',
		'en-US': 'Get favorited notes'
	},

	tags: ['account', 'notes', 'favorites'],

	requireCredential: true,

	kind: 'favorites-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),,
	}
};

export default define(meta, async (ps, user) => {
	const query = {
		userId: user.id
	} as any;

	const sort = {
		id: -1
	};

	if (ps.sinceId) {
		sort.id = 1;
		query.id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query.id = {
			$lt: ps.untilId
		};
	}

	// Get favorites
	const favorites = await Favorite
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return await packMany(favorites, user);
});
