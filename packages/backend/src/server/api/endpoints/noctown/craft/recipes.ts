/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownRecipesRepository, NoctownRecipeIngredientsRepository, NoctownPlayerItemsRepository } from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				description: { type: 'string', nullable: true },
				resultItemId: { type: 'string' },
				resultItemName: { type: 'string' },
				resultQuantity: { type: 'number' },
				requiredLevel: { type: 'number' },
				isLocked: { type: 'boolean' },
				category: { type: 'string' },
				craftingTime: { type: 'number' },
				craftingCost: { type: 'number' },
				canCraft: { type: 'boolean' },
				ingredients: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							itemId: { type: 'string' },
							itemName: { type: 'string' },
							quantity: { type: 'number' },
							playerHas: { type: 'number' },
							hasEnough: { type: 'boolean' },
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		category: {
			type: 'string',
			description: 'Filter by category',
		},
		craftableOnly: {
			type: 'boolean',
			description: 'Show only recipes player can craft',
			default: false,
		},
		limit: {
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 50,
		},
		offset: {
			type: 'integer',
			minimum: 0,
			default: 0,
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownRecipesRepository)
		private recipesRepository: NoctownRecipesRepository,

		@Inject(DI.noctownRecipeIngredientsRepository)
		private ingredientsRepository: NoctownRecipeIngredientsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Build query
			const query = this.recipesRepository.createQueryBuilder('recipe')
				.leftJoinAndSelect('recipe.resultItem', 'resultItem')
				.orderBy('recipe.category', 'ASC')
				.addOrderBy('recipe.name', 'ASC')
				.take(ps.limit)
				.skip(ps.offset);

			if (ps.category) {
				query.andWhere('recipe.category = :category', { category: ps.category });
			}

			const recipes = await query.getMany();

			// Get player's inventory for checking craftability
			const playerItems = await this.playerItemsRepository.find({
				where: { playerId: me.id },
				relations: ['item'],
			});

			// Create inventory map for quick lookup
			const inventoryMap = new Map<string, number>();
			for (const pi of playerItems) {
				inventoryMap.set(pi.itemId, pi.quantity);
			}

			// Build response with ingredient info and craftability
			const result = await Promise.all(recipes.map(async (recipe) => {
				// Get ingredients for this recipe
				const ingredients = await this.ingredientsRepository.find({
					where: { recipeId: recipe.id },
					relations: ['item'],
				});

				// Check if player can craft this recipe
				const ingredientInfo = ingredients.map(ing => {
					const playerHas = inventoryMap.get(ing.itemId) ?? 0;
					return {
						itemId: ing.itemId,
						itemName: ing.item?.name ?? 'Unknown',
						quantity: ing.quantity,
						playerHas,
						hasEnough: playerHas >= ing.quantity,
					};
				});

				const canCraft = !recipe.isLocked &&
					ingredientInfo.every(i => i.hasEnough);

				return {
					id: recipe.id,
					name: recipe.name,
					description: recipe.description,
					resultItemId: recipe.resultItemId,
					resultItemName: recipe.resultItem?.name ?? 'Unknown',
					resultQuantity: recipe.resultQuantity,
					requiredLevel: recipe.requiredLevel,
					isLocked: recipe.isLocked,
					category: recipe.category,
					craftingTime: recipe.craftingTime,
					craftingCost: recipe.craftingCost,
					canCraft,
					ingredients: ingredientInfo,
				};
			}));

			// Filter to craftable only if requested
			if (ps.craftableOnly) {
				return result.filter(r => r.canCraft);
			}

			return result;
		});
	}
}
