import define from '../../../define.js';
import { RegistryItems } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
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
