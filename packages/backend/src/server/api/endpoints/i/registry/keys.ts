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
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
		domain: { type: 'string', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			const query = this.registryItemsRepository.createQueryBuilder('item')
				.select('item.key');
			if (accessToken) {
				query.where('item.domain = :domain', { domain: accessToken.id });
			} else {
				if (ps.domain) {
					query.where('item.domain = :domain', { domain: ps.domain });
				} else {
					query.where('item.domain IS NULL');
				}
			}
			query.andWhere('item.userId = :userId', { userId: me.id });
			query.andWhere('item.scope = :scope', { scope: ps.scope });

			const items = await query.getMany();

			return items.map(x => x.key);
		});
	}
}
