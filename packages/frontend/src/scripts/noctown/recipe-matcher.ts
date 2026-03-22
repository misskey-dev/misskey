/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface RecipeIngredient {
	itemId: string;
	itemName: string;
	quantity: number;
	playerHas: number;
	hasEnough: boolean;
}

export interface Recipe {
	id: string;
	name: string;
	description: string | null;
	resultItemId: string;
	resultItemName: string;
	resultQuantity: number;
	requiredLevel: number;
	isLocked: boolean;
	category: string;
	craftingTime: number;
	craftingCost: number;
	canCraft: boolean;
	ingredients: RecipeIngredient[];
}

export interface InventoryItem {
	itemId: string;
	name: string;
	quantity: number;
}

export interface RecipeSuggestion {
	recipe: Recipe;
	missingIngredients: Array<{
		itemId: string;
		itemName: string;
		needed: number;
		have: number;
		missing: number;
	}>;
	completionPercentage: number;
	canCraft: boolean;
}

/**
 * Recipe matcher for suggesting craftable and near-craftable recipes
 */
export class RecipeMatcher {
	private recipes: Recipe[] = [];
	private inventory: Map<string, number> = new Map();

	/**
	 * Update recipes list
	 */
	public setRecipes(recipes: Recipe[]): void {
		this.recipes = recipes;
	}

	/**
	 * Update inventory
	 */
	public setInventory(items: InventoryItem[]): void {
		this.inventory.clear();
		for (const item of items) {
			this.inventory.set(item.itemId, item.quantity);
		}
	}

	/**
	 * Get recipes that can be crafted right now
	 */
	public getCraftableRecipes(): Recipe[] {
		return this.recipes.filter(recipe => this.canCraft(recipe));
	}

	/**
	 * Check if a recipe can be crafted
	 */
	public canCraft(recipe: Recipe): boolean {
		if (recipe.isLocked) return false;

		for (const ingredient of recipe.ingredients) {
			const have = this.inventory.get(ingredient.itemId) ?? 0;
			if (have < ingredient.quantity) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get recipe suggestions sorted by completion percentage
	 */
	public getSuggestions(limit: number = 10): RecipeSuggestion[] {
		const suggestions: RecipeSuggestion[] = [];

		for (const recipe of this.recipes) {
			if (recipe.isLocked) continue;

			const suggestion = this.analyzeRecipe(recipe);
			suggestions.push(suggestion);
		}

		// Sort by:
		// 1. Craftable recipes first
		// 2. Then by completion percentage (highest first)
		// 3. Then by name
		suggestions.sort((a, b) => {
			if (a.canCraft !== b.canCraft) {
				return a.canCraft ? -1 : 1;
			}
			if (a.completionPercentage !== b.completionPercentage) {
				return b.completionPercentage - a.completionPercentage;
			}
			return a.recipe.name.localeCompare(b.recipe.name);
		});

		return suggestions.slice(0, limit);
	}

	/**
	 * Analyze a recipe for suggestion
	 */
	private analyzeRecipe(recipe: Recipe): RecipeSuggestion {
		const missingIngredients: RecipeSuggestion['missingIngredients'] = [];
		let totalRequired = 0;
		let totalHave = 0;

		for (const ingredient of recipe.ingredients) {
			const have = this.inventory.get(ingredient.itemId) ?? 0;
			const needed = ingredient.quantity;

			totalRequired += needed;
			totalHave += Math.min(have, needed);

			if (have < needed) {
				missingIngredients.push({
					itemId: ingredient.itemId,
					itemName: ingredient.itemName,
					needed,
					have,
					missing: needed - have,
				});
			}
		}

		const completionPercentage = totalRequired > 0
			? (totalHave / totalRequired) * 100
			: 100;

		return {
			recipe,
			missingIngredients,
			completionPercentage,
			canCraft: missingIngredients.length === 0,
		};
	}

	/**
	 * Find recipes that use a specific item
	 */
	public findRecipesUsingItem(itemId: string): Recipe[] {
		return this.recipes.filter(recipe =>
			recipe.ingredients.some(ing => ing.itemId === itemId),
		);
	}

	/**
	 * Find recipes that produce a specific item
	 */
	public findRecipesProducingItem(itemId: string): Recipe[] {
		return this.recipes.filter(recipe => recipe.resultItemId === itemId);
	}

	/**
	 * Get recipes by category
	 */
	public getRecipesByCategory(category: string): Recipe[] {
		return this.recipes.filter(recipe => recipe.category === category);
	}

	/**
	 * Search recipes by name
	 */
	public searchRecipes(query: string): Recipe[] {
		const lowerQuery = query.toLowerCase();
		return this.recipes.filter(recipe =>
			recipe.name.toLowerCase().includes(lowerQuery) ||
			recipe.resultItemName.toLowerCase().includes(lowerQuery) ||
			(recipe.description?.toLowerCase().includes(lowerQuery) ?? false),
		);
	}

	/**
	 * Get "almost craftable" recipes (missing only 1-2 ingredients or small quantities)
	 */
	public getAlmostCraftableRecipes(maxMissingTypes: number = 2, maxMissingTotal: number = 5): RecipeSuggestion[] {
		const suggestions = this.getSuggestions(100);

		return suggestions.filter(s => {
			if (s.canCraft) return true; // Include craftable recipes

			// Check if it's "almost" craftable
			const missingTypes = s.missingIngredients.length;
			const missingTotal = s.missingIngredients.reduce((sum, ing) => sum + ing.missing, 0);

			return missingTypes <= maxMissingTypes && missingTotal <= maxMissingTotal;
		});
	}

	/**
	 * Calculate what items are needed to craft all suggested recipes
	 */
	public getShoppingList(recipes: Recipe[]): Array<{ itemId: string; itemName: string; needed: number; have: number }> {
		const needed = new Map<string, { itemName: string; total: number }>();

		for (const recipe of recipes) {
			for (const ingredient of recipe.ingredients) {
				const existing = needed.get(ingredient.itemId);
				if (existing) {
					existing.total += ingredient.quantity;
				} else {
					needed.set(ingredient.itemId, {
						itemName: ingredient.itemName,
						total: ingredient.quantity,
					});
				}
			}
		}

		return Array.from(needed.entries()).map(([itemId, { itemName, total }]) => ({
			itemId,
			itemName,
			needed: total,
			have: this.inventory.get(itemId) ?? 0,
		})).filter(item => item.have < item.needed);
	}

	/**
	 * Get recipe count statistics
	 */
	public getStatistics(): {
		total: number;
		craftable: number;
		locked: number;
		byCategory: Record<string, number>;
	} {
		const byCategory: Record<string, number> = {};

		for (const recipe of this.recipes) {
			byCategory[recipe.category] = (byCategory[recipe.category] ?? 0) + 1;
		}

		return {
			total: this.recipes.length,
			craftable: this.getCraftableRecipes().length,
			locked: this.recipes.filter(r => r.isLocked).length,
			byCategory,
		};
	}
}

// Singleton instance
let instance: RecipeMatcher | null = null;

export function getRecipeMatcher(): RecipeMatcher {
	if (!instance) {
		instance = new RecipeMatcher();
	}
	return instance;
}

export function disposeRecipeMatcher(): void {
	instance = null;
}
