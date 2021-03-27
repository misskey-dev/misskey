import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { NoteFavorites } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'お気に入りに登録した投稿一覧を取得します。',
		'en-US': 'Get favorited notes'
	},

	tags: ['account', 'notes', 'favorites'],

	requireCredential: true as const,

	kind: 'read:favorites',

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
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'NoteFavorite',
		}
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(NoteFavorites.createQueryBuilder('favorite'), ps.sinceId, ps.untilId)
		.andWhere(`favorite.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('favorite.note', 'note');

	const favorites = await query
		.take(ps.limit!)
		.getMany();

	return await NoteFavorites.packMany(favorites, user);
});
