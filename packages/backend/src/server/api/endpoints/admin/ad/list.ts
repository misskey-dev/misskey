import define from '../../../define';
import { Ads } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const query = makePaginationQuery(Ads.createQueryBuilder('ad'), ps.sinceId, ps.untilId)
		.andWhere('ad.expiresAt > :now', { now: new Date() });

	const ads = await query.take(ps.limit).getMany();

	return ads;
});
