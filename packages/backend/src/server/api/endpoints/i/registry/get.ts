import $ from 'cafy';
import define from '../../../define';
import { RegistryItems } from '@/models/index';
import { ApiError } from '../../../error';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		key: {
			validator: $.str,
		},

		scope: {
			validator: $.optional.arr($.str.match(/^[a-zA-Z0-9_]+$/)),
			default: [],
		},
	},

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a',
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id })
		.andWhere('item.key = :key', { key: ps.key })
		.andWhere('item.scope = :scope', { scope: ps.scope });

	const item = await query.getOne();

	if (item == null) {
		throw new ApiError(meta.errors.noSuchKey);
	}

	return item.value;
});
