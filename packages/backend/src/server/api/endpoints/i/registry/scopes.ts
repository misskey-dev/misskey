import define from '../../../define.js';
import { RegistryItems } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.select('item.scope')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id });

	const items = await query.getMany();

	const res = [] as string[][];

	for (const item of items) {
		if (res.some(scope => scope.join('.') === item.scope.join('.'))) continue;
		res.push(item.scope);
	}

	return res;
});
