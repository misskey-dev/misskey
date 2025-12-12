/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownItemsRepository, NoctownPlayerItemsRepository, NoctownPlayersRepository } from '@/models/_.js';
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
			success: { type: 'boolean' },
			distributedCount: { type: 'number' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'f1a2b3c4-5678-90ab-cdef-111111111111',
		},
		itemNotFound: {
			message: 'Item not found.',
			code: 'ITEM_NOT_FOUND',
			id: 'f1a2b3c4-5678-90ab-cdef-222222222222',
		},
		playerNotFound: {
			message: 'One or more players not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'f1a2b3c4-5678-90ab-cdef-333333333333',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		itemId: { type: 'string' },
		quantity: {
			type: 'integer',
			minimum: 1,
			maximum: 9999,
			default: 1,
		},
		targetPlayerIds: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
			maxItems: 100,
		},
		distributeToAll: {
			type: 'boolean',
			default: false,
		},
	},
	required: ['itemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (admin only for distribution)
			const isAdmin = await this.roleService.isAdministrator(me);

			if (!isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Check if item exists
			const item = await this.itemsRepository.findOneBy({ id: ps.itemId });
			if (!item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Get target players
			let targetPlayers: { id: string }[];

			if (ps.distributeToAll) {
				// Distribute to all players
				targetPlayers = await this.playersRepository.find({
					select: ['id'],
				});
			} else if (ps.targetPlayerIds && ps.targetPlayerIds.length > 0) {
				// Distribute to specific players
				targetPlayers = await this.playersRepository.find({
					where: { id: In(ps.targetPlayerIds) },
					select: ['id'],
				});

				if (targetPlayers.length !== ps.targetPlayerIds.length) {
					throw new ApiError(meta.errors.playerNotFound);
				}
			} else {
				return { success: false, distributedCount: 0 };
			}

			// Distribute items
			let distributedCount = 0;

			for (const player of targetPlayers) {
				// Check if player already has this item
				const existingItem = await this.playerItemsRepository.findOne({
					where: {
						playerId: player.id,
						itemId: ps.itemId,
					},
				});

				if (existingItem) {
					// Add to existing quantity
					await this.playerItemsRepository.increment(
						{ id: existingItem.id },
						'quantity',
						ps.quantity ?? 1,
					);
				} else {
					// Create new entry
					await this.playerItemsRepository.insert({
						id: this.idService.gen(),
						playerId: player.id,
						itemId: ps.itemId,
						quantity: ps.quantity ?? 1,
					});
				}

				distributedCount++;
			}

			return {
				success: true,
				distributedCount,
			};
		});
	}
}
