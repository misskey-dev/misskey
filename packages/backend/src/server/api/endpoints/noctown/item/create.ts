/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownItemsRepository,
	NoctownPlayerItemsRepository,
	NoctownPlayersRepository,
	NoctownWalletsRepository,
	DriveFilesRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

// Cost to create a player item (in coins)
const CREATION_COST = 500;
const MAX_PLAYER_ITEMS = 50;

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		properties: {
			item: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					flavorText: { type: 'string', nullable: true },
					itemType: { type: 'string' },
					imageUrl: { type: 'string', nullable: true },
				},
			},
			remainingBalance: { type: 'string' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0018-0001-0001-000000000001',
		},
		insufficientFunds: {
			message: 'Not enough coins.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'c1d2e3f4-0018-0001-0001-000000000002',
		},
		maxItemsReached: {
			message: 'Maximum player-created items reached.',
			code: 'MAX_ITEMS_REACHED',
			id: 'c1d2e3f4-0018-0001-0001-000000000003',
		},
		invalidImage: {
			message: 'Invalid or inaccessible image file.',
			code: 'INVALID_IMAGE',
			id: 'c1d2e3f4-0018-0001-0001-000000000004',
		},
		nameTooLong: {
			message: 'Item name is too long.',
			code: 'NAME_TOO_LONG',
			id: 'c1d2e3f4-0018-0001-0001-000000000005',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 64 },
		flavorText: { type: 'string', maxLength: 500, nullable: true },
		itemType: {
			type: 'string',
			enum: ['normal', 'placeable', 'furniture', 'wallpaper', 'frame'],
			default: 'normal',
		},
		imageFileId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Check player-created item count
			const playerCreatedCount = await this.noctownItemsRepository.count({
				where: { creatorId: me.id },
			});
			if (playerCreatedCount >= MAX_PLAYER_ITEMS) {
				throw new ApiError(meta.errors.maxItemsReached);
			}

			// Check wallet balance
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
			const balance = wallet ? BigInt(wallet.balance) : BigInt(0);
			if (balance < BigInt(CREATION_COST)) {
				throw new ApiError(meta.errors.insufficientFunds);
			}

			// Validate image if provided
			let imageUrl: string | null = null;
			if (ps.imageFileId) {
				const file = await this.driveFilesRepository.findOne({
					where: { id: ps.imageFileId, userId: me.id },
				});
				if (!file || !file.type.startsWith('image/')) {
					throw new ApiError(meta.errors.invalidImage);
				}
				imageUrl = file.url;
			}

			// Create the item
			const item = await this.noctownItemsRepository.insertOne({
				id: this.idService.gen(),
				name: ps.name,
				flavorText: ps.flavorText ?? null,
				itemType: ps.itemType ?? 'normal',
				rarity: 1, // Player-created items start at Common rarity
				isUnique: true, // Player-created items are unique
				isPlayerCreated: true,
				creatorId: me.id,
				imageUrl: imageUrl,
				fullImageUrl: imageUrl,
				shopPrice: null, // Cannot be bought from shop
				shopSellPrice: 10, // Can be sold for minimal price
			});

			// Add to player's inventory
			await this.noctownPlayerItemsRepository.insert({
				id: this.idService.gen(),
				playerId: player.id,
				itemId: item.id,
				quantity: 1,
			});

			// Deduct creation cost
			const newBalance = balance - BigInt(CREATION_COST);
			if (wallet) {
				await this.noctownWalletsRepository.update(
					{ playerId: player.id },
					{ balance: newBalance.toString() },
				);
			}

			return {
				item: {
					id: item.id,
					name: item.name,
					flavorText: item.flavorText,
					itemType: item.itemType,
					imageUrl: item.imageUrl,
					isUnique: item.isUnique,
					isPlayerCreated: item.isPlayerCreated,
				},
				remainingBalance: newBalance.toString(),
			};
		});
	}
}
