import define from '../../define';
import { PageLikes } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true,

	kind: 'read:page-likes',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			page: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'Page',
			},
		},
	},
} as const;

const paramDef = {
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
	const query = makePaginationQuery(PageLikes.createQueryBuilder('like'), ps.sinceId, ps.untilId)
		.andWhere(`like.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('like.page', 'page');

	const likes = await query
		.take(ps.limit)
		.getMany();

	return await PageLikes.packMany(likes, user);
});
