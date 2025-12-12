/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository, NoctownItemsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:noctown',
	errors: {
		noSuchGacha: {
			message: 'No such gacha.',
			code: 'NO_SUCH_GACHA',
			id: 'f2b03a03-0001-0005-0001-000000000001',
		},
	},
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				itemId: { type: 'string' },
				itemName: { type: 'string' },
				itemType: { type: 'string' },
				weight: { type: 'number' },
				rarityTier: { type: 'number' },
				isUnique: { type: 'boolean' },
				isUniqueObtained: { type: 'boolean' },
				maxQuantity: { type: 'number', nullable: true },
				currentQuantity: { type: 'number' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['gachaId'],
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
	) {
		super(meta, paramDef, async (ps) => {
			const gacha = await this.noctownGachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.noSuchGacha);
			}

			const gachaItems = await this.noctownGachaItemsRepository.find({
				where: { gachaId: ps.gachaId },
				order: { rarityTier: 'DESC', weight: 'DESC' },
			});

			const results = await Promise.all(gachaItems.map(async (gachaItem) => {
				const item = await this.noctownItemsRepository.findOneBy({ id: gachaItem.itemId });

				return {
					id: gachaItem.id,
					itemId: gachaItem.itemId,
					itemName: item?.name ?? 'Unknown',
					itemType: item?.itemType ?? 'unknown',
					weight: gachaItem.weight,
					rarityTier: gachaItem.rarityTier,
					isUnique: gachaItem.isUnique,
					isUniqueObtained: gachaItem.isUniqueObtained,
					maxQuantity: gachaItem.maxQuantity,
					currentQuantity: gachaItem.currentQuantity,
				};
			}));

			return results;
		});
	}
}
