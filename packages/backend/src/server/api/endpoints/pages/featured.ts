import define from '../../define';
import { Pages } from '@/models/index';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Page',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const query = Pages.createQueryBuilder('page')
		.where('page.visibility = \'public\'')
		.andWhere('page.likedCount > 0')
		.orderBy('page.likedCount', 'DESC');

	const pages = await query.take(10).getMany();

	return await Pages.packMany(pages, me);
});
