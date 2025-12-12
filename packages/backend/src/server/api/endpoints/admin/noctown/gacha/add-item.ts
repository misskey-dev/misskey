/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository, NoctownItemsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:noctown',
	errors: {
		noSuchGacha: {
			message: 'No such gacha.',
			code: 'NO_SUCH_GACHA',
			id: 'f2b03a03-0001-0003-0001-000000000001',
		},
		noSuchItem: {
			message: 'No such item.',
			code: 'NO_SUCH_ITEM',
			id: 'f2b03a03-0001-0003-0002-000000000001',
		},
		itemAlreadyExists: {
			message: 'Item already exists in this gacha.',
			code: 'ITEM_ALREADY_EXISTS',
			id: 'f2b03a03-0001-0003-0003-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			id: { type: 'string' },
			gachaId: { type: 'string' },
			itemId: { type: 'string' },
			weight: { type: 'number' },
			rarityTier: { type: 'number' },
			isUnique: { type: 'boolean' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: { type: 'string', format: 'misskey:id' },
		itemId: { type: 'string', format: 'misskey:id' },
		weight: { type: 'integer', minimum: 1, default: 100 },
		rarityTier: { type: 'integer', minimum: 1, maximum: 5, default: 1 },
		isUnique: { type: 'boolean', default: false },
		maxQuantity: { type: 'integer', minimum: 1, nullable: true },
	},
	required: ['gachaId', 'itemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,
		@Inject(DI.noctownGachaItemsRepository)
		private noctownGachaItemsRepository: NoctownGachaItemsRepository,
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Verify gacha exists
			const gacha = await this.noctownGachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.noSuchGacha);
			}

			// Verify item exists
			const item = await this.noctownItemsRepository.findOneBy({ id: ps.itemId });
			if (!item) {
				throw new ApiError(meta.errors.noSuchItem);
			}

			// Check if item already exists in this gacha
			const existingItem = await this.noctownGachaItemsRepository.findOneBy({
				gachaId: ps.gachaId,
				itemId: ps.itemId,
			});
			if (existingItem) {
				throw new ApiError(meta.errors.itemAlreadyExists);
			}

			const gachaItem = await this.noctownGachaItemsRepository.insertOne({
				id: this.idService.gen(),
				gachaId: ps.gachaId,
				itemId: ps.itemId,
				weight: ps.weight ?? 100,
				rarityTier: ps.rarityTier ?? 1,
				isUnique: ps.isUnique ?? false,
				isUniqueObtained: false,
				maxQuantity: ps.maxQuantity ?? null,
				currentQuantity: 0,
			});

			this.moderationLogService.log(me, 'addNoctownGachaItem', {
				gachaId: ps.gachaId,
				gachaName: gacha.name,
				itemId: ps.itemId,
				itemName: item.name,
			});

			return {
				id: gachaItem.id,
				gachaId: gachaItem.gachaId,
				itemId: gachaItem.itemId,
				weight: gachaItem.weight,
				rarityTier: gachaItem.rarityTier,
				isUnique: gachaItem.isUnique,
				maxQuantity: gachaItem.maxQuantity,
			};
		});
	}
}
