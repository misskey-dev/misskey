/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistryItemsRepository } from '@/models/_.js';
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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.registryItemsRepository.createQueryBuilder('item')
				.select(['item.scope', 'item.domain'])
				.where('item.userId = :userId', { userId: me.id });

			const items = await query.getMany();

			const res = [] as { domain: string | null; scopes: string[][] }[];

			for (const item of items) {
				const target = res.find(x => x.domain === item.domain);
				if (target) {
					if (target.scopes.some(scope => scope.join('.') === item.scope.join('.'))) continue;
					target.scopes.push(item.scope);
				} else {
					res.push({
						domain: item.domain,
						scopes: [item.scope],
					});
				}
			}

			return res;
		});
	}
}
