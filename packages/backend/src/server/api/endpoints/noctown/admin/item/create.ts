/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownItemsRepository } from '@/models/_.js';
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
			name: { type: 'string' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'e1f2a3b4-5678-90ab-cdef-111111111111',
		},
		itemAlreadyExists: {
			message: 'Item with this name already exists.',
			code: 'ITEM_ALREADY_EXISTS',
			id: 'e1f2a3b4-5678-90ab-cdef-222222222222',
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
			default: 0,
		},
		itemType: {
			type: 'string',
			enum: ['normal', 'tool', 'skin', 'placeable', 'agent', 'seed', 'feed'],
			default: 'normal',
		},
		isUnique: {
			type: 'boolean',
			default: false,
		},
		shopPrice: {
			type: 'integer',
			minimum: 0,
			nullable: true,
		},
		shopSellPrice: {
			type: 'integer',
			minimum: 0,
			nullable: true,
		},
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
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

			// Check if item with same name exists
			const existing = await this.itemsRepository.findOneBy({ name: ps.name });
			if (existing) {
				throw new ApiError(meta.errors.itemAlreadyExists);
			}

			// Create item
			const itemId = this.idService.gen();

			await this.itemsRepository.insert({
				id: itemId,
				name: ps.name,
				flavorText: ps.flavorText ?? null,
				imageUrl: ps.imageUrl ?? null,
				fullImageUrl: ps.fullImageUrl ?? null,
				rarity: ps.rarity ?? 0,
				itemType: ps.itemType ?? 'normal',
				isUnique: ps.isUnique ?? false,
				isPlayerCreated: true,
				creatorId: me.id,
				shopPrice: ps.shopPrice ?? null,
				shopSellPrice: ps.shopSellPrice ?? null,
			});

			return {
				id: itemId,
				name: ps.name,
			};
		});
	}
}
