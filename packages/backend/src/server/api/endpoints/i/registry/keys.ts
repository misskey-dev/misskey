import define from '../../../define';
import { RegistryItems } from '@/models/index';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		type: 'object',
		properties: {
			scope: { type: 'array', default: [], items: {
				type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString(),
			}, },
		},
		required: [],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.select('item.key')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id })
		.andWhere('item.scope = :scope', { scope: ps.scope });

	const items = await query.getMany();

	return items.map(x => x.key);
});
