import $ from 'cafy';
import define from '../../../define';
import { RegistryItems } from '@/models/index';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		scope: {
			validator: $.optional.arr($.str.match(/^[a-zA-Z0-9_]+$/)),
			default: [],
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id })
		.andWhere('item.scope = :scope', { scope: ps.scope });

	const items = await query.getMany();

	const res = {} as Record<string, string>;

	for (const item of items) {
		const type = typeof item.value;
		res[item.key] =
			item.value === null ? 'null' :
			Array.isArray(item.value) ? 'array' :
			type === 'number' ? 'number' :
			type === 'string' ? 'string' :
			type === 'boolean' ? 'boolean' :
			type === 'object' ? 'object' :
			null as never;
	}

	return res;
});
