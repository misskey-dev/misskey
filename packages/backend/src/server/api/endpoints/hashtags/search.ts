import define from '../../define';
import { Hashtags } from '@/models/index';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	params: {
		type: 'object',
		properties: {
			limit: { type: 'integer', maximum: 100, default: 10, },
			query: { type: 'string', },
			offset: { type: 'integer', default: 0, },
		},
		required: ['query'],
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const hashtags = await Hashtags.createQueryBuilder('tag')
		.where('tag.name like :q', { q: ps.query.toLowerCase() + '%' })
		.orderBy('tag.count', 'DESC')
		.groupBy('tag.id')
		.take(ps.limit)
		.skip(ps.offset)
		.getMany();

	return hashtags.map(tag => tag.name);
});
