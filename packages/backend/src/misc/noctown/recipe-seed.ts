/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {
	NoctownItemsRepository,
	NoctownRecipesRepository,
	NoctownRecipeIngredientsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

// Recipe definition type
export interface RecipeDefinition {
	resultName: string;
	resultFlavorText: string;
	resultRarity: number;
	resultItemType: 'normal' | 'tool' | 'skin' | 'placeable' | 'agent' | 'seed' | 'feed';
	resultShopSellPrice: number | null;
	ingredients: Array<{
		itemName: string;
		quantity: number;
	}>;
}

// Predefined recipes
export const NOCTOWN_RECIPES: RecipeDefinition[] = [
	// Fishing rod - requires wood
	{
		resultName: '釣り竿',
		resultFlavorText: '木材と糸から作った簡素な釣り竿。池で釣りができる。',
		resultRarity: 1,
		resultItemType: 'tool',
		resultShopSellPrice: 50,
		ingredients: [
			{ itemName: '木材', quantity: 3 },
			{ itemName: '糸', quantity: 1 },
		],
	},
	// Axe - requires stone and wood
	{
		resultName: '斧',
		resultFlavorText: '木を伐採するための斧。木材を集めるのに必要。',
		resultRarity: 1,
		resultItemType: 'tool',
		resultShopSellPrice: 30,
		ingredients: [
			{ itemName: '木材', quantity: 2 },
			{ itemName: '石', quantity: 2 },
		],
	},
	// Fence - requires wood
	{
		resultName: 'フェンス',
		resultFlavorText: '木材から作った柵。設置して囲いを作れる。',
		resultRarity: 0,
		resultItemType: 'placeable',
		resultShopSellPrice: 20,
		ingredients: [
			{ itemName: '木材', quantity: 4 },
		],
	},
	// Thread from fiber
	{
		resultName: '糸',
		resultFlavorText: '繊維を紡いで作った糸。釣り竿や服の材料になる。',
		resultRarity: 0,
		resultItemType: 'normal',
		resultShopSellPrice: 10,
		ingredients: [
			{ itemName: '繊維', quantity: 3 },
		],
	},
	// Watering can - requires iron and wood
	{
		resultName: 'じょうろ',
		resultFlavorText: '作物に水をやるための道具。',
		resultRarity: 1,
		resultItemType: 'tool',
		resultShopSellPrice: 40,
		ingredients: [
			{ itemName: '鉄', quantity: 2 },
			{ itemName: '木材', quantity: 1 },
		],
	},
	// Seed bag
	{
		resultName: '種袋',
		resultFlavorText: '野菜の種が入った袋。畑に植えて育てよう。',
		resultRarity: 0,
		resultItemType: 'seed',
		resultShopSellPrice: 15,
		ingredients: [
			{ itemName: '草', quantity: 5 },
		],
	},
	// Animal feed
	{
		resultName: 'エサ',
		resultFlavorText: '動物に与えるエサ。鶏や牛を育てるのに必要。',
		resultRarity: 0,
		resultItemType: 'feed',
		resultShopSellPrice: 10,
		ingredients: [
			{ itemName: '草', quantity: 3 },
			{ itemName: '穀物', quantity: 2 },
		],
	},
	// Basic decoration - flower pot
	{
		resultName: '花瓶',
		resultFlavorText: '花を飾るための小さな花瓶。',
		resultRarity: 0,
		resultItemType: 'placeable',
		resultShopSellPrice: 25,
		ingredients: [
			{ itemName: '粘土', quantity: 3 },
		],
	},
	// Chair
	{
		resultName: '椅子',
		resultFlavorText: '木材で作ったシンプルな椅子。',
		resultRarity: 0,
		resultItemType: 'placeable',
		resultShopSellPrice: 30,
		ingredients: [
			{ itemName: '木材', quantity: 5 },
		],
	},
	// Table
	{
		resultName: 'テーブル',
		resultFlavorText: '木材で作ったテーブル。',
		resultRarity: 0,
		resultItemType: 'placeable',
		resultShopSellPrice: 50,
		ingredients: [
			{ itemName: '木材', quantity: 8 },
		],
	},
];

@Injectable()
export class RecipeSeedService {
	constructor(
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownRecipesRepository)
		private noctownRecipesRepository: NoctownRecipesRepository,

		@Inject(DI.noctownRecipeIngredientsRepository)
		private noctownRecipeIngredientsRepository: NoctownRecipeIngredientsRepository,

		private idService: IdService,
	) {}

	/**
	 * Seed all predefined recipes
	 */
	public async seedRecipes(): Promise<{ created: number; skipped: number }> {
		let created = 0;
		let skipped = 0;

		for (const recipeDef of NOCTOWN_RECIPES) {
			try {
				const result = await this.createRecipeFromDefinition(recipeDef);
				if (result) {
					created++;
				} else {
					skipped++;
				}
			} catch (e) {
				console.error(`Failed to seed recipe ${recipeDef.resultName}:`, e);
				skipped++;
			}
		}

		return { created, skipped };
	}

	/**
	 * Create a recipe from definition, including result item and ingredients
	 */
	private async createRecipeFromDefinition(def: RecipeDefinition): Promise<boolean> {
		// Check if recipe already exists
		const existingResult = await this.noctownItemsRepository.findOne({
			where: { name: def.resultName },
		});

		if (existingResult) {
			// Check if recipe already exists for this item
			const existingRecipe = await this.noctownRecipesRepository.findOne({
				where: { resultItemId: existingResult.id },
			});

			if (existingRecipe) {
				return false; // Recipe already exists
			}
		}

		// Create or get result item
		let resultItem = existingResult;
		if (!resultItem) {
			resultItem = await this.noctownItemsRepository.save({
				id: this.idService.gen(),
				name: def.resultName,
				flavorText: def.resultFlavorText,
				imageUrl: null,
				fullImageUrl: null,
				rarity: def.resultRarity,
				itemType: def.resultItemType,
				isUnique: false,
				isPlayerCreated: false,
				creatorId: null,
				shopPrice: null,
				shopSellPrice: def.resultShopSellPrice,
			});
		}

		// Create or get ingredient items
		const ingredientItems: Array<{ item: { id: string }; quantity: number }> = [];
		for (const ing of def.ingredients) {
			let ingredientItem = await this.noctownItemsRepository.findOne({
				where: { name: ing.itemName },
			});

			if (!ingredientItem) {
				// Create placeholder ingredient item
				ingredientItem = await this.noctownItemsRepository.save({
					id: this.idService.gen(),
					name: ing.itemName,
					flavorText: `${ing.itemName}。様々なアイテムの材料になる。`,
					imageUrl: null,
					fullImageUrl: null,
					rarity: 0,
					itemType: 'normal',
					isUnique: false,
					isPlayerCreated: false,
					creatorId: null,
					shopPrice: null,
					shopSellPrice: 5,
				});
			}

			ingredientItems.push({ item: ingredientItem, quantity: ing.quantity });
		}

		// Create recipe
		const recipe = await this.noctownRecipesRepository.save({
			id: this.idService.gen(),
			resultItemId: resultItem.id,
			resultQuantity: 1,
			isUnlocked: true,
		});

		// Create recipe ingredients
		for (const ing of ingredientItems) {
			await this.noctownRecipeIngredientsRepository.save({
				id: this.idService.gen(),
				recipeId: recipe.id,
				itemId: ing.item.id,
				quantity: ing.quantity,
			});
		}

		return true;
	}

	/**
	 * Create a single recipe by name
	 */
	public async createRecipe(recipeName: string): Promise<boolean> {
		const recipeDef = NOCTOWN_RECIPES.find(r => r.resultName === recipeName);
		if (!recipeDef) {
			throw new Error(`Recipe ${recipeName} not found in definitions`);
		}

		return this.createRecipeFromDefinition(recipeDef);
	}

	/**
	 * Ensure fishing rod recipe exists
	 */
	public async ensureFishingRodRecipe(): Promise<void> {
		await this.createRecipe('釣り竿');
	}

	/**
	 * Ensure axe recipe exists
	 */
	public async ensureAxeRecipe(): Promise<void> {
		await this.createRecipe('斧');
	}
}
