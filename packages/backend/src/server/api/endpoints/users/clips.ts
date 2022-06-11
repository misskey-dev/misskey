import define from '../../define.js';
import { Clips } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

export const meta = {
	tags: ['users', 'clips'],

	description: 'Show all clips this user owns.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Clip',
		},
	},
} as const;

export const paramDef = {
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
	const query = makePaginationQuery(Clips.createQueryBuilder('clip'), ps.sinceId, ps.untilId)
		.andWhere(`clip.userId = :userId`, { userId: ps.userId })
		.andWhere('clip.isPublic = true');

	const clips = await query
		.take(ps.limit)
		.getMany();

	return await Clips.packMany(clips);
});
