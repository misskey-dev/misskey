/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownItemsRepository, NoctownUniqueItemsRepository } from '@/models/_.js';
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
			itemId: { type: 'string' },
			uniqueItemId: { type: 'string' },
			serialNumber: { type: 'string' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'u1n2i3q4-crea-0001-0001-000000000001',
		},
		itemAlreadyExists: {
			message: 'Item with this name already exists.',
			code: 'ITEM_ALREADY_EXISTS',
			id: 'u1n2i3q4-crea-0001-0001-000000000002',
		},
		uniqueItemAlreadyExists: {
			message: 'Unique item record already exists for this item.',
			code: 'UNIQUE_ITEM_ALREADY_EXISTS',
			id: 'u1n2i3q4-crea-0001-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			minLength: 1,
			maxLength: 128,
		},
		serialNumber: {
			type: 'string',
			minLength: 1,
			maxLength: 128,
		},
		flavorText: {
			type: 'string',
			maxLength: 1000,
			nullable: true,
		},
		imageUrl: {
			type: 'string',
			maxLength: 512,
			nullable: true,
		},
		fullImageUrl: {
			type: 'string',
			maxLength: 512,
			nullable: true,
		},
		rarity: {
			type: 'integer',
			minimum: 0,
			maximum: 5,
			default: 4, // Unique items default to UR
		},
		itemType: {
			type: 'string',
			enum: ['normal', 'tool', 'skin', 'placeable', 'agent', 'seed', 'feed'],
			default: 'normal',
		},
		originMethod: {
			type: 'string',
			enum: ['system', 'gacha', 'quest', 'craft', 'trade', 'event'],
			default: 'system',
		},
		isObtainable: {
			type: 'boolean',
			default: false,
		},
		isTradeable: {
			type: 'boolean',
			default: true,
		},
	},
	required: ['name', 'serialNumber'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownUniqueItemsRepository)
		private uniqueItemsRepository: NoctownUniqueItemsRepository,

		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (admin only)
			const isAdmin = await this.roleService.isAdministrator(me);
			if (!isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Check if item with same name exists
			const existingItem = await this.itemsRepository.findOneBy({ name: ps.name });
			if (existingItem) {
				// Check if unique item record already exists
				const existingUnique = await this.uniqueItemsRepository.findOneBy({ itemId: existingItem.id });
				if (existingUnique) {
					throw new ApiError(meta.errors.uniqueItemAlreadyExists);
				}
			}

			// Create base item (marked as unique)
			let itemId: string;
			if (existingItem) {
				itemId = existingItem.id;
				// Update to mark as unique if not already
				if (!existingItem.isUnique) {
					await this.itemsRepository.update({ id: itemId }, { isUnique: true });
				}
			} else {
				itemId = this.idService.gen();
				await this.itemsRepository.insert({
					id: itemId,
					name: ps.name,
					flavorText: ps.flavorText ?? null,
					imageUrl: ps.imageUrl ?? null,
					fullImageUrl: ps.fullImageUrl ?? null,
					rarity: ps.rarity ?? 4,
					itemType: ps.itemType ?? 'normal',
					isUnique: true,
					isPlayerCreated: false,
					creatorId: null,
					shopPrice: null, // Unique items not for sale in shop
					shopSellPrice: null,
				});
			}

			// Create unique item record
			const uniqueItemId = this.idService.gen();
			await this.uniqueItemsRepository.insert({
				id: uniqueItemId,
				itemId,
				serialNumber: ps.serialNumber,
				currentOwnerId: null,
				creatorId: null,
				ownershipHistory: [],
				originMethod: ps.originMethod ?? 'system',
				isObtainable: ps.isObtainable ?? false,
				isTradeable: ps.isTradeable ?? true,
				firstObtainedAt: null,
			});

			return {
				itemId,
				uniqueItemId,
				serialNumber: ps.serialNumber,
			};
		});
	}
}
