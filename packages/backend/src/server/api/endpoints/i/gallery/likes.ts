import define from '../../../define.js';
import { GalleryLikes } from '@/models/index.js';
import { makePaginationQuery } from '../../../common/make-pagination-query.js';

export const meta = {
	tags: ['account', 'gallery'],

	requireCredential: true,

	kind: 'read:gallery-likes',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				post: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'GalleryPost',
				},
			},
		}
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = makePaginationQuery(GalleryLikes.createQueryBuilder('like'), ps.sinceId, ps.untilId)
		.andWhere(`like.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('like.post', 'post');

	const likes = await query
		.take(ps.limit)
		.getMany();

	return await GalleryLikes.packMany(likes, user);
});
