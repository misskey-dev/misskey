import { publishMainStream } from '@/services/stream.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RegistryItems } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1 },
		value: {},
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
	},
	required: ['key', 'value'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const query = RegistryItems.createQueryBuilder('item')
		.where('item.domain IS NULL')
		.andWhere('item.userId = :userId', { userId: user.id })
		.andWhere('item.key = :key', { key: ps.key })
		.andWhere('item.scope = :scope', { scope: ps.scope });

	const existingItem = await query.getOne();

	if (existingItem) {
		await RegistryItems.update(existingItem.id, {
			updatedAt: new Date(),
			value: ps.value,
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
			value: ps.value,
		});
	}

	// TODO: サードパーティアプリが傍受出来てしまうのでどうにかする
	publishMainStream(user.id, 'registryUpdated', {
		scope: ps.scope,
		key: ps.key,
		value: ps.value,
	});
});
