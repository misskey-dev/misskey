/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistryItemsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	requireCredential: true,

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: '97a1e8e7-c0f7-47d2-957a-92e61256e01a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		key: { type: 'string' },
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
		domain: { type: 'string', nullable: true },
	},
	required: ['key'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			const query = this.registryItemsRepository.createQueryBuilder('item');
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
			query.andWhere('item.key = :key', { key: ps.key });
			query.andWhere('item.scope = :scope', { scope: ps.scope });

			const item = await query.getOne();

			if (item == null) {
				throw new ApiError(meta.errors.noSuchKey);
			}

			return {
				updatedAt: item.updatedAt,
				value: item.value,
			};
		});
	}
}
