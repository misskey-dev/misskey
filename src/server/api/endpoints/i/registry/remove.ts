import $ from 'cafy';
import define from '../../../define';
import { RegistryItems } from '../../../../../models';
import { ApiError } from '../../../error';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		key: {
			validator: $.str.match(/^[a-zA-Z0-9_]+$/)
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
			id: '1fac4e8a-a6cd-4e39-a4a5-3a7e11f1b019'
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

	RegistryItems.remove(item);
});
