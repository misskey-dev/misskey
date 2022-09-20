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
	properties: {},
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
				.select('item.scope')
				.where('item.domain IS NULL')
				.andWhere('item.userId = :userId', { userId: me.id });

			const items = await query.getMany();

			const res = [] as string[][];

			for (const item of items) {
				if (res.some(scope => scope.join('.') === item.scope.join('.'))) continue;
				res.push(item.scope);
			}

			return res;
		});
	}
}
