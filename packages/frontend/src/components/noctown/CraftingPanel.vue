<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.header">
		<h2 :class="$style.title">
			<i class="ti ti-hammer"></i>
			合成
		</h2>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<!-- Category tabs -->
	<div :class="$style.tabs">
		<button
			v-for="cat in categories"
			:key="cat.id"
			:class="[$style.tab, selectedCategory === cat.id && $style.activeTab]"
			@click="selectedCategory = cat.id"
		>
			<i :class="cat.icon"></i>
			{{ cat.name }}
		</button>
	</div>

	<!-- Recipe list -->
	<div :class="$style.content">
		<div v-if="isLoading" :class="$style.loading">
			<MkLoading/>
		</div>

		<div v-else-if="filteredRecipes.length === 0" :class="$style.empty">
			<i class="ti ti-mood-empty"></i>
			<p>レシピがありません</p>
		</div>

		<div v-else :class="$style.recipeList">
			<button
				v-for="recipe in filteredRecipes"
				:key="recipe.id"
				:class="[$style.recipeItem, selectedRecipe?.id === recipe.id && $style.selectedRecipe]"
				@click="selectRecipe(recipe)"
			>
				<div :class="$style.recipeIcon">
					<i class="ti ti-package"></i>
				</div>
				<div :class="$style.recipeInfo">
					<span :class="$style.recipeName">{{ recipe.name }}</span>
					<span :class="[$style.recipeStatus, recipe.canCraft ? $style.canCraft : $style.cannotCraft]">
						{{ recipe.canCraft ? '作成可能' : '素材不足' }}
					</span>
				</div>
				<span :class="$style.resultQuantity">x{{ recipe.resultQuantity }}</span>
			</button>
		</div>
	</div>

	<!-- Selected recipe details -->
	<div v-if="selectedRecipe" :class="$style.details">
		<div :class="$style.detailsHeader">
			<h3>{{ selectedRecipe.name }}</h3>
			<p v-if="selectedRecipe.description" :class="$style.description">
				{{ selectedRecipe.description }}
			</p>
		</div>

		<!-- Ingredients -->
		<div :class="$style.ingredients">
			<h4>必要素材</h4>
			<div :class="$style.ingredientList">
				<div
					v-for="ing in selectedRecipe.ingredients"
					:key="ing.itemId"
					:class="[$style.ingredient, ing.hasEnough ? $style.hasEnough : $style.notEnough]"
				>
					<span :class="$style.ingredientName">{{ ing.itemName }}</span>
					<span :class="$style.ingredientQuantity">
						{{ ing.playerHas }}/{{ ing.quantity * craftQuantity }}
					</span>
				</div>
			</div>
		</div>

		<!-- Cost -->
		<div v-if="selectedRecipe.craftingCost > 0" :class="$style.cost">
			<span>コスト:</span>
			<span :class="$style.costAmount">
				<i class="ti ti-coin"></i>
				{{ selectedRecipe.craftingCost * craftQuantity }}
			</span>
		</div>

		<!-- Quantity selector -->
		<div :class="$style.quantitySelector">
			<span>個数:</span>
			<button :class="$style.quantityBtn" @click="craftQuantity = Math.max(1, craftQuantity - 1)">
				<i class="ti ti-minus"></i>
			</button>
			<input
				v-model.number="craftQuantity"
				type="number"
				min="1"
				max="99"
				:class="$style.quantityInput"
			/>
			<button :class="$style.quantityBtn" @click="craftQuantity = Math.min(99, craftQuantity + 1)">
				<i class="ti ti-plus"></i>
			</button>
		</div>

		<!-- Craft button -->
		<button
			:class="[$style.craftBtn, !canCraftSelected && $style.disabled]"
			:disabled="!canCraftSelected || isCrafting"
			@click="executeCraft"
		>
			<template v-if="isCrafting">
				<MkLoading :em="true"/>
				合成中...
			</template>
			<template v-else>
				<i class="ti ti-hammer"></i>
				合成する
			</template>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

interface Ingredient {
	itemId: string;
	itemName: string;
	quantity: number;
	playerHas: number;
	hasEnough: boolean;
}

interface Recipe {
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
	ingredients: Ingredient[];
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'crafted', itemId: string, itemName: string, quantity: number): void;
}>();

const categories = [
	{ id: 'all', name: '全て', icon: 'ti ti-list' },
	{ id: 'normal', name: '一般', icon: 'ti ti-package' },
	{ id: 'equipment', name: '装備', icon: 'ti ti-sword' },
	{ id: 'consumable', name: '消耗品', icon: 'ti ti-bottle' },
	{ id: 'decoration', name: '装飾', icon: 'ti ti-home' },
];

const isLoading = ref(true);
const isCrafting = ref(false);
const recipes = ref<Recipe[]>([]);
const selectedCategory = ref('all');
const selectedRecipe = ref<Recipe | null>(null);
const craftQuantity = ref(1);

const filteredRecipes = computed(() => {
	if (selectedCategory.value === 'all') {
		return recipes.value;
	}
	return recipes.value.filter(r => r.category === selectedCategory.value);
});

const canCraftSelected = computed(() => {
	if (!selectedRecipe.value) return false;

	// Check all ingredients with current quantity
	for (const ing of selectedRecipe.value.ingredients) {
		if (ing.playerHas < ing.quantity * craftQuantity.value) {
			return false;
		}
	}

	return true;
});

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function loadRecipes(): Promise<void> {
	isLoading.value = true;

	try {
		const res = await window.fetch('/api/noctown/craft/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (!res.ok) throw new Error('Failed to load recipes');

		recipes.value = await res.json();
	} catch (e) {
		console.error('Failed to load recipes:', e);
	} finally {
		isLoading.value = false;
	}
}

function selectRecipe(recipe: Recipe): void {
	selectedRecipe.value = recipe;
	craftQuantity.value = 1;
}

async function executeCraft(): Promise<void> {
	if (!selectedRecipe.value || !canCraftSelected.value || isCrafting.value) return;

	isCrafting.value = true;

	try {
		const res = await window.fetch('/api/noctown/craft/execute', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				recipeId: selectedRecipe.value.id,
				quantity: craftQuantity.value,
			}),
		});

		if (!res.ok) {
			const error = await res.json();
			throw new Error(error.error?.message ?? 'Craft failed');
		}

		const result = await res.json();

		// Emit success event
		emit('crafted', result.resultItemId, result.resultItemName, result.resultQuantity);

		// Reload recipes to update inventory counts
		await loadRecipes();

		// Keep selection if recipe still exists
		if (selectedRecipe.value) {
			const updated = recipes.value.find(r => r.id === selectedRecipe.value!.id);
			selectedRecipe.value = updated ?? null;
		}
	} catch (e) {
		console.error('Craft failed:', e);
		// TODO: Show error toast
	} finally {
		isCrafting.value = false;
	}
}

// Reset quantity when recipe changes
watch(selectedRecipe, () => {
	craftQuantity.value = 1;
});

onMounted(() => {
	loadRecipes();
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	height: 100%;
	max-height: 600px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	overflow: hidden;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.title {
	margin: 0;
	font-size: 18px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.closeBtn {
	background: none;
	border: none;
	padding: 8px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	transition: opacity 0.15s;

	&:hover {
		opacity: 1;
	}
}

.tabs {
	display: flex;
	gap: 4px;
	padding: 8px 16px;
	overflow-x: auto;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: none;
	border: none;
	border-radius: 20px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 13px;
	white-space: nowrap;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.activeTab {
	background: var(--MI_THEME-accent);
	color: white;

	&:hover {
		background: var(--MI_THEME-accent);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.loading, .empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	i {
		font-size: 48px;
		margin-bottom: 8px;
	}
}

.recipeList {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.recipeItem {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border: 1px solid transparent;
	border-radius: 8px;
	cursor: pointer;
	text-align: left;
	transition: all 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.selectedRecipe {
	border-color: var(--MI_THEME-accent);
	background: color-mix(in srgb, var(--MI_THEME-accent) 10%, transparent);
}

.recipeIcon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-divider);
	border-radius: 8px;
	font-size: 20px;
}

.recipeInfo {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.recipeName {
	font-weight: 600;
	font-size: 14px;
}

.recipeStatus {
	font-size: 11px;
}

.canCraft {
	color: #22c55e;
}

.cannotCraft {
	color: #94a3b8;
}

.resultQuantity {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.details {
	padding: 16px;
	border-top: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
}

.detailsHeader {
	margin-bottom: 12px;

	h3 {
		margin: 0 0 4px 0;
		font-size: 16px;
	}
}

.description {
	margin: 0;
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.ingredients {
	margin-bottom: 12px;

	h4 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: var(--MI_THEME-fg);
		opacity: 0.7;
	}
}

.ingredientList {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.ingredient {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	font-size: 13px;
}

.hasEnough {
	.ingredientQuantity {
		color: #22c55e;
	}
}

.notEnough {
	.ingredientQuantity {
		color: #ef4444;
	}
}

.ingredientName {
	font-weight: 500;
}

.cost {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	font-size: 14px;
}

.costAmount {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #f59e0b;
}

.quantitySelector {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
}

.quantityBtn {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.quantityInput {
	width: 60px;
	padding: 8px;
	text-align: center;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 14px;
}

.craftBtn {
	width: 100%;
	padding: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: var(--MI_THEME-accent);
	border: none;
	border-radius: 8px;
	cursor: pointer;
	color: white;
	font-size: 15px;
	font-weight: 600;
	transition: opacity 0.15s;

	&:hover:not(.disabled) {
		opacity: 0.9;
	}
}

.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style>
