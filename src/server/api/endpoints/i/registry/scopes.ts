import define from '../../../define';
import { RegistryItems } from '@/models/index';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
	}
};

export default define(meta, async (ps, user) => {
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
