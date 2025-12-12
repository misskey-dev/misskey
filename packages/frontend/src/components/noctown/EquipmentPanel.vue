<script setup lang="ts">
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, onMounted } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
	acquiredAt: string;
}

interface EquippedInfo {
	skinId: string | null;
	skinName: string | null;
}

const props = defineProps<{
	playerId: string;
	currentSkinId: string | null;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'equipped', skinId: string | null, skinData: Record<string, unknown> | null): void;
}>();

const isLoading = ref(true);
const skinItems = ref<InventoryItem[]>([]);
const equippedSkinId = ref<string | null>(props.currentSkinId);
const isEquipping = ref(false);
const error = ref<string | null>(null);

// Rarity colors
const rarityColors: Record<string, string> = {
	common: '#8b8b8b',
	uncommon: '#2ecc71',
	rare: '#3498db',
	epic: '#9b59b6',
	legendary: '#f39c12',
};

// Computed: Available skins from inventory
const availableSkins = computed(() => {
	return skinItems.value.filter(item => item.itemType === 'skin');
});

// Computed: Currently equipped skin
const equippedSkin = computed(() => {
	if (!equippedSkinId.value) return null;
	return skinItems.value.find(item => item.itemId === equippedSkinId.value) ?? null;
});

onMounted(async () => {
	await loadInventory();
});

async function loadInventory() {
	isLoading.value = true;
	error.value = null;

	try {
		const result = await misskeyApi('noctown/item/inventory', {});
		skinItems.value = (result as InventoryItem[]).filter((item: InventoryItem) => item.itemType === 'skin');
	} catch (err) {
		error.value = 'Failed to load inventory';
		console.error('Failed to load inventory:', err);
	} finally {
		isLoading.value = false;
	}
}

async function equipSkin(item: InventoryItem) {
	if (isEquipping.value) return;

	isEquipping.value = true;
	error.value = null;

	try {
		await misskeyApi('noctown/player/equip-skin', {
			playerItemId: item.id,
		});

		equippedSkinId.value = item.itemId;
		emit('equipped', item.itemId, null);
	} catch (err: any) {
		if (err.code === 'NOT_SKIN_ITEM') {
			error.value = 'This item cannot be equipped as a skin';
		} else {
			error.value = 'Failed to equip skin';
		}
		console.error('Failed to equip skin:', err);
	} finally {
		isEquipping.value = false;
	}
}

async function unequipSkin() {
	if (isEquipping.value || !equippedSkinId.value) return;

	isEquipping.value = true;
	error.value = null;

	try {
		await misskeyApi('noctown/player/unequip-skin', {});

		equippedSkinId.value = null;
		emit('equipped', null, null);
	} catch (err) {
		error.value = 'Failed to unequip skin';
		console.error('Failed to unequip skin:', err);
	} finally {
		isEquipping.value = false;
	}
}

function close() {
	emit('close');
}

function getRarityColor(rarity: string): string {
	return rarityColors[rarity] ?? rarityColors.common;
}
</script>

<template>
	<MkModalWindow
		:width="500"
		:height="600"
		@close="close"
		@closed="close"
	>
		<template #header>
			<span class="header-title">Equipment</span>
		</template>

		<div class="equipment-panel">
			<!-- Currently Equipped -->
			<section class="equipped-section">
				<h3 class="section-title">Currently Equipped</h3>
				<div v-if="equippedSkin" class="equipped-item">
					<div class="item-preview">
						<span class="item-icon">S</span>
					</div>
					<div class="item-info">
						<span class="item-name">{{ equippedSkin.itemName }}</span>
					</div>
					<MkButton
						small
						danger
						:disabled="isEquipping"
						@click="unequipSkin"
					>
						Unequip
					</MkButton>
				</div>
				<div v-else class="no-equipped">
					<span>No skin equipped</span>
				</div>
			</section>

			<!-- Available Skins -->
			<section class="skins-section">
				<h3 class="section-title">Available Skins</h3>

				<div v-if="isLoading" class="loading">
					Loading inventory...
				</div>

				<div v-else-if="availableSkins.length === 0" class="no-skins">
					<span>No skins in inventory</span>
					<p class="hint">Find or purchase skins from shops to customize your character!</p>
				</div>

				<div v-else class="skins-grid">
					<div
						v-for="item in availableSkins"
						:key="item.id"
						class="skin-item"
						:class="{ equipped: item.itemId === equippedSkinId }"
						@click="item.itemId !== equippedSkinId && equipSkin(item)"
					>
						<div class="skin-preview">
							<span class="skin-icon">S</span>
							<span v-if="item.itemId === equippedSkinId" class="equipped-badge">Equipped</span>
						</div>
						<div class="skin-info">
							<span class="skin-name">{{ item.itemName }}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Error Message -->
			<div v-if="error" class="error-message">
				{{ error }}
			</div>

			<!-- Actions -->
			<div class="actions">
				<MkButton @click="close">
					Close
				</MkButton>
			</div>
		</div>
	</MkModalWindow>
</template>

<style lang="scss" scoped>
.equipment-panel {
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	height: 100%;
	overflow-y: auto;
}

.section-title {
	font-size: 14px;
	font-weight: bold;
	color: var(--fg);
	margin: 0 0 12px 0;
	padding-bottom: 8px;
	border-bottom: 1px solid var(--divider);
}

.equipped-section {
	.equipped-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: var(--panel);
		border-radius: 8px;
	}

	.item-preview {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accentedBg);
		border: 2px solid;
		border-radius: 8px;
	}

	.item-icon {
		font-size: 24px;
		font-weight: bold;
		color: var(--accent);
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-name {
		font-weight: bold;
	}

	.item-rarity {
		font-size: 12px;
		text-transform: capitalize;
	}

	.no-equipped {
		padding: 16px;
		text-align: center;
		color: var(--fgTransparent);
		background: var(--panel);
		border-radius: 8px;
	}
}

.skins-section {
	flex: 1;
	min-height: 0;

	.loading,
	.no-skins {
		padding: 24px;
		text-align: center;
		color: var(--fgTransparent);
		background: var(--panel);
		border-radius: 8px;
	}

	.hint {
		margin-top: 8px;
		font-size: 12px;
		opacity: 0.7;
	}
}

.skins-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 12px;
}

.skin-item {
	padding: 12px;
	background: var(--panel);
	border-radius: 8px;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover:not(.equipped) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	&.equipped {
		cursor: default;
		opacity: 0.7;
	}
}

.skin-preview {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--accentedBg);
	border: 2px solid;
	border-radius: 8px;
	margin-bottom: 8px;
}

.skin-icon {
	font-size: 32px;
	font-weight: bold;
	color: var(--accent);
}

.equipped-badge {
	position: absolute;
	bottom: 4px;
	left: 50%;
	transform: translateX(-50%);
	padding: 2px 8px;
	background: var(--accent);
	color: white;
	font-size: 10px;
	border-radius: 4px;
}

.skin-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.skin-name {
	font-weight: bold;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.skin-rarity {
	font-size: 11px;
	text-transform: capitalize;
}

.skin-description {
	margin-top: 4px;
	font-size: 11px;
	color: var(--fgTransparent);
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.error-message {
	padding: 12px;
	background: rgba(255, 0, 0, 0.1);
	color: #ff4444;
	border-radius: 8px;
	text-align: center;
}

.actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid var(--divider);
}
</style>
