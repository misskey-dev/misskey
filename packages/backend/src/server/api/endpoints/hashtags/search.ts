import define from '../../define.js';
import { Hashtags } from '@/models/index.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		query: { type: 'string' },
		offset: { type: 'integer', default: 0 },
	},
	required: ['query'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const hashtags = await Hashtags.createQueryBuilder('tag')
		.where('tag.name like :q', { q: ps.query.toLowerCase() + '%' })
		.orderBy('tag.count', 'DESC')
		.groupBy('tag.id')
		.take(ps.limit)
		.skip(ps.offset)
		.getMany();

	return hashtags.map(tag => tag.name);
});
