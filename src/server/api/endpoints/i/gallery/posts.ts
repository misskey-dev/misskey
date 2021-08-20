import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { GalleryPosts } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	tags: ['account', 'gallery'],

	requireCredential: true as const,

	kind: 'read:gallery',

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
			ref: 'GalleryPost'
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.andWhere(`post.userId = :meId`, { meId: user.id });

	const posts = await query
		.take(ps.limit!)
		.getMany();

	return await GalleryPosts.packMany(posts, user);
});
