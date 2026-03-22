/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository, NoctownItemsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['noctown', 'admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:noctown',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string' },
			gachaId: { type: 'string' },
			itemId: { type: 'string' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'g1a2c3h4-addi-0001-0001-000000000001',
		},
		gachaNotFound: {
			message: 'Gacha not found.',
			code: 'GACHA_NOT_FOUND',
			id: 'g1a2c3h4-addi-0001-0001-000000000002',
		},
		itemNotFound: {
			message: 'Item not found.',
			code: 'ITEM_NOT_FOUND',
			id: 'g1a2c3h4-addi-0001-0001-000000000003',
		},
		itemAlreadyInGacha: {
			message: 'Item already exists in this gacha.',
			code: 'ITEM_ALREADY_IN_GACHA',
			id: 'g1a2c3h4-addi-0001-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: {
			type: 'string',
		},
		itemId: {
			type: 'string',
		},
		weight: {
			type: 'integer',
			minimum: 1,
			maximum: 10000,
			default: 100,
		},
		rarityTier: {
			type: 'integer',
			minimum: 0,
			maximum: 4,
			default: 0,
		},
		isUnique: {
			type: 'boolean',
			default: false,
		},
		maxQuantity: {
			type: 'integer',
			minimum: 1,
			nullable: true,
		},
	},
	required: ['gachaId', 'itemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownGachasRepository)
		private gachasRepository: NoctownGachasRepository,

		@Inject(DI.noctownGachaItemsRepository)
		private gachaItemsRepository: NoctownGachaItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (moderator or admin)
			const isModerator = await this.roleService.isModerator(me);
			const isAdmin = await this.roleService.isAdministrator(me);

			if (!isModerator && !isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Check if gacha exists
			const gacha = await this.gachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.gachaNotFound);
			}

			// Check if item exists
			const item = await this.itemsRepository.findOneBy({ id: ps.itemId });
			if (!item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Check if item already in gacha
			const existing = await this.gachaItemsRepository.findOneBy({
				gachaId: ps.gachaId,
				itemId: ps.itemId,
			});
			if (existing) {
				throw new ApiError(meta.errors.itemAlreadyInGacha);
			}

			// Create gacha item
			const gachaItemId = this.idService.gen();

			await this.gachaItemsRepository.insert({
				id: gachaItemId,
				gachaId: ps.gachaId,
				itemId: ps.itemId,
				weight: ps.weight ?? 100,
				rarityTier: ps.rarityTier ?? 0,
				isUnique: ps.isUnique ?? false,
				isUniqueObtained: false,
				maxQuantity: ps.maxQuantity ?? null,
				currentQuantity: 0,
			});

			return {
				id: gachaItemId,
				gachaId: ps.gachaId,
				itemId: ps.itemId,
			};
		});
	}
}
