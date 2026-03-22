/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownRecipesRepository,
	NoctownRecipeIngredientsRepository,
	NoctownPlayerItemsRepository,
	NoctownWalletsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';
import { DataSource } from 'typeorm';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			resultItemId: { type: 'string' },
			resultItemName: { type: 'string' },
			resultQuantity: { type: 'number' },
		},
	},

	errors: {
		recipeNotFound: {
			message: 'Recipe not found.',
			code: 'RECIPE_NOT_FOUND',
			id: 'a1b2c3d4-5678-90ab-cdef-111111111111',
		},
		recipeLocked: {
			message: 'Recipe is locked.',
			code: 'RECIPE_LOCKED',
			id: 'a1b2c3d4-5678-90ab-cdef-222222222222',
		},
		insufficientMaterials: {
			message: 'Insufficient materials.',
			code: 'INSUFFICIENT_MATERIALS',
			id: 'a1b2c3d4-5678-90ab-cdef-333333333333',
		},
		insufficientFunds: {
			message: 'Insufficient funds.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'a1b2c3d4-5678-90ab-cdef-444444444444',
		},
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-5678-90ab-cdef-555555555555',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		recipeId: { type: 'string' },
		quantity: {
			type: 'integer',
			minimum: 1,
			maximum: 99,
			default: 1,
		},
	},
	required: ['recipeId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.noctownRecipesRepository)
		private recipesRepository: NoctownRecipesRepository,

		@Inject(DI.noctownRecipeIngredientsRepository)
		private ingredientsRepository: NoctownRecipeIngredientsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private walletsRepository: NoctownWalletsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get recipe
			const recipe = await this.recipesRepository.findOne({
				where: { id: ps.recipeId },
				relations: ['resultItem'],
			});

			if (!recipe) {
				throw new ApiError(meta.errors.recipeNotFound);
			}

			if (recipe.isLocked) {
				throw new ApiError(meta.errors.recipeLocked);
			}

			// Get player
			const player = await this.playersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get ingredients
			const ingredients = await this.ingredientsRepository.find({
				where: { recipeId: recipe.id },
			});

			// Calculate total materials and cost needed
			const totalCost = recipe.craftingCost * ps.quantity;

			// Check wallet if there's a cost
			if (totalCost > 0) {
				const wallet = await this.walletsRepository.findOneBy({ playerId: player.id });
				if (!wallet || BigInt(wallet.balance) < BigInt(totalCost)) {
					throw new ApiError(meta.errors.insufficientFunds);
				}
			}

			// Check if player has enough materials
			const playerItems = await this.playerItemsRepository.find({
				where: { playerId: player.id },
			});

			const inventoryMap = new Map<string, { id: string; quantity: number }>();
			for (const pi of playerItems) {
				inventoryMap.set(pi.itemId, { id: pi.id, quantity: pi.quantity });
			}

			for (const ingredient of ingredients) {
				const playerItem = inventoryMap.get(ingredient.itemId);
				const requiredQuantity = ingredient.quantity * ps.quantity;

				if (!playerItem || playerItem.quantity < requiredQuantity) {
					throw new ApiError(meta.errors.insufficientMaterials);
				}
			}

			// Execute crafting in transaction
			await this.db.transaction(async (manager) => {
				// Deduct materials
				for (const ingredient of ingredients) {
					if (!ingredient.isConsumed) continue;

					const playerItem = inventoryMap.get(ingredient.itemId)!;
					const requiredQuantity = ingredient.quantity * ps.quantity;

					if (playerItem.quantity > requiredQuantity) {
						// Reduce quantity
						await manager.update(
							this.playerItemsRepository.target,
							{ id: playerItem.id },
							{ quantity: playerItem.quantity - requiredQuantity },
						);
					} else {
						// Remove item entirely
						await manager.delete(
							this.playerItemsRepository.target,
							{ id: playerItem.id },
						);
					}
				}

				// Deduct cost
				if (totalCost > 0) {
					await manager.decrement(
						this.walletsRepository.target,
						{ playerId: player.id },
						'balance',
						totalCost,
					);
				}

				// Add result item
				const existingResultItem = await manager.findOne(
					this.playerItemsRepository.target,
					{
						where: {
							playerId: player.id,
							itemId: recipe.resultItemId,
						},
					},
				);

				const resultQuantity = recipe.resultQuantity * ps.quantity;

				if (existingResultItem) {
					// Increase quantity
					await manager.increment(
						this.playerItemsRepository.target,
						{ id: existingResultItem.id },
						'quantity',
						resultQuantity,
					);
				} else {
					// Create new item entry
					await manager.insert(
						this.playerItemsRepository.target,
						{
							id: this.idService.gen(),
							playerId: player.id,
							itemId: recipe.resultItemId,
							quantity: resultQuantity,
						},
					);
				}
			});

			return {
				success: true,
				resultItemId: recipe.resultItemId,
				resultItemName: recipe.resultItem?.name ?? 'Unknown',
				resultQuantity: recipe.resultQuantity * ps.quantity,
			};
		});
	}
}
