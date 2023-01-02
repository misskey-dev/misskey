import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistryItemsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';

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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.registryItemsRepository.createQueryBuilder('item')
				.where('item.domain IS NULL')
				.andWhere('item.userId = :userId', { userId: me.id })
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
	}
}
