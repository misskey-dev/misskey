import define from '../../define';
import { Pages } from '@/models/index';

export const meta = {
	tags: ['pages'],

	requireCredential: false as const,

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Page',
		},
	},
};

export default define(meta, async (ps, me) => {
	const query = Pages.createQueryBuilder('page')
		.where('page.visibility = \'public\'')
		.andWhere('page.likedCount > 0')
		.orderBy('page.likedCount', 'DESC');

	const pages = await query.take(10).getMany();

	return await Pages.packMany(pages, me);
});
