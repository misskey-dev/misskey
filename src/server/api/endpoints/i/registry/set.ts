import $ from 'cafy';
import { publishMainStream } from '@/services/stream';
import define from '../../../define';
import { RegistryItems } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		key: {
			validator: $.str.min(1)
		},

		value: {
			validator: $.nullable.any
		},

		scope: {
			validator: $.optional.arr($.str.match(/^[a-zA-Z0-9_]+$/)),
			default: [],
		},
	}
};

export default define(meta, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id })
		.andWhere('item.key = :key', { key: ps.key })
		.andWhere('item.scope = :scope', { scope: ps.scope });

	const existingItem = await query.getOne();

	if (existingItem) {
		await RegistryItems.update(existingItem.id, {
			updatedAt: new Date(),
			value: ps.value
		});
	} else {
		await RegistryItems.insert({
			id: genId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: user.id,
			domain: null,
			scope: ps.scope,
			key: ps.key,
			value: ps.value
		});
	}

	// TODO: サードパーティアプリが傍受出来てしまうのでどうにかする
	publishMainStream(user.id, 'registryUpdated', {
		scope: ps.scope,
		key: ps.key,
		value: ps.value
	});
});
