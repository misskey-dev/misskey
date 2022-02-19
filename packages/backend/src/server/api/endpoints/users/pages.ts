import define from '../../define';
import { Pages } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['users', 'pages'],
} as const;

const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = makePaginationQuery(Pages.createQueryBuilder('page'), ps.sinceId, ps.untilId)
		.andWhere(`page.userId = :userId`, { userId: ps.userId })
		.andWhere('page.visibility = \'public\'');

	const pages = await query
		.take(ps.limit)
		.getMany();

	return await Pages.packMany(pages);
});
