/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistryItemsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: '1fac4e8a-a6cd-4e39-a4a5-3a7e11f1b019',
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
	},
	required: ['key'],
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
				.andWhere('item.key = :key', { key: ps.key })
				.andWhere('item.scope = :scope', { scope: ps.scope });

			const item = await query.getOne();

			if (item == null) {
				throw new ApiError(meta.errors.noSuchKey);
			}

			await this.registryItemsRepository.remove(item);
		});
	}
}
