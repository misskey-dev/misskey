import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { MoreThan, LessThan } from 'typeorm';
import { NoteFavorites } from '../../../../models';

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
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
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
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	// Get favorites
	const favorites = await NoteFavorites.find({
		where: query,
		take: ps.limit,
		order: sort
	});

	return await NoteFavorites.packMany(favorites, user);
});
