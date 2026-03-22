<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.overlay" @click.self="$emit('close')">
	<div :class="$style.dialog">
		<div :class="$style.header">
			<div :class="$style.npcInfo">
				<div :class="$style.npcAvatar">
					<i class="ti ti-user-circle"></i>
				</div>
				<div :class="$style.npcText">
					<h3 :class="$style.npcName">{{ shopData?.name ?? '店主' }}</h3>
					<p :class="$style.npcGreeting">{{ shopData?.greeting ?? 'いらっしゃいませ' }}</p>
				</div>
			</div>
			<button :class="$style.closeBtn" @click="$emit('close')">
				<i class="ti ti-x"></i>
			</button>
		</div>

		<!-- Tab navigation -->
		<div :class="$style.tabs">
			<button
				:class="[$style.tab, activeTab === 'buy' && $style.activeTab]"
				@click="activeTab = 'buy'"
			>
				<i class="ti ti-shopping-cart"></i>
				購入
			</button>
			<button
				:class="[$style.tab, activeTab === 'sell' && $style.activeTab]"
				@click="activeTab = 'sell'"
			>
				<i class="ti ti-coin"></i>
				売却
			</button>
		</div>

		<!-- Balance display -->
		<div :class="$style.balance">
			<i class="ti ti-wallet"></i>
			所持金: <span :class="$style.balanceAmount">{{ formatBalance(playerBalance) }}</span>
		</div>

		<!-- Buy tab -->
		<div v-if="activeTab === 'buy'" :class="$style.content">
			<div v-if="loading" :class="$style.loading">
				<i class="ti ti-loader-2 ti-spin"></i>
				読み込み中...
			</div>
			<div v-else-if="!shopData || shopData.inventory.length === 0" :class="$style.empty">
				商品がありません
			</div>
			<div v-else :class="$style.itemList">
				<div
					v-for="item in shopData.inventory"
					:key="item.id"
					:class="[$style.item, !item.isAvailable && $style.unavailable]"
					@click="selectBuyItem(item)"
				>
					<div :class="$style.itemImage">
						<img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
						<i v-else class="ti ti-box"></i>
					</div>
					<div :class="$style.itemInfo">
						<span :class="$style.itemName">{{ item.name }}</span>
						<span :class="[$style.itemRarity, `rarity-${item.rarity}`]">
							{{ rarityLabel(item.rarity) }}
						</span>
					</div>
					<div :class="$style.itemPrice">
						<span :class="$style.price">{{ formatBalance(item.buyPrice) }}</span>
						<span v-if="item.stock !== null" :class="$style.stock">
							残り {{ item.stock }}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Sell tab -->
		<div v-if="activeTab === 'sell'" :class="$style.content">
			<div v-if="loading" :class="$style.loading">
				<i class="ti ti-loader-2 ti-spin"></i>
				読み込み中...
			</div>
			<div v-else-if="sellableItems.length === 0" :class="$style.empty">
				売却できるアイテムがありません
			</div>
			<div v-else :class="$style.itemList">
				<div
					v-for="item in sellableItems"
					:key="item.id"
					:class="$style.item"
					@click="selectSellItem(item)"
				>
					<div :class="$style.itemImage">
						<i class="ti ti-box"></i>
					</div>
					<div :class="$style.itemInfo">
						<span :class="$style.itemName">{{ item.name }}</span>
						<span :class="$style.itemQuantity">x{{ item.quantity }}</span>
					</div>
					<div :class="$style.itemPrice">
						<span :class="$style.sellPrice">+{{ formatBalance(item.sellPrice) }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Selected item panel -->
		<div v-if="selectedItem" :class="$style.selectedPanel">
			<div :class="$style.selectedInfo">
				<span :class="$style.selectedName">{{ selectedItem.name }}</span>
				<span v-if="activeTab === 'buy'" :class="$style.selectedPrice">
					{{ formatBalance((selectedItem as any).buyPrice * quantity) }}
				</span>
				<span v-else :class="$style.selectedPrice">
					+{{ formatBalance((selectedItem as any).sellPrice * quantity) }}
				</span>
			</div>
			<div :class="$style.quantityControl">
				<button :class="$style.quantityBtn" :disabled="quantity <= 1" @click="quantity--">
					<i class="ti ti-minus"></i>
				</button>
				<span :class="$style.quantityValue">{{ quantity }}</span>
				<button
					:class="$style.quantityBtn"
					:disabled="quantity >= maxQuantity"
					@click="quantity++"
				>
					<i class="ti ti-plus"></i>
				</button>
			</div>
			<button
				:class="[$style.confirmBtn, processing && $style.processing]"
				:disabled="processing || !canConfirm"
				@click="confirmTransaction"
			>
				<i v-if="processing" class="ti ti-loader-2 ti-spin"></i>
				<template v-else>
					{{ activeTab === 'buy' ? '購入する' : '売却する' }}
				</template>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

interface ShopItem {
	id: string;
	itemId: string;
	name: string;
	flavorText: string | null;
	imageUrl: string | null;
	rarity: number;
	buyPrice: number;
	sellPrice: number | null;
	stock: number | null;
	isAvailable: boolean;
}

interface SellableItem {
	id: string;
	itemId: string;
	name: string;
	quantity: number;
	sellPrice: number;
}

interface ShopData {
	id: string;
	type: string;
	name: string;
	greeting: string;
	inventory: ShopItem[];
}

const props = defineProps<{
	interiorId: string;
	playerBalance: number | string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'balanceUpdated', newBalance: string): void;
}>();

const activeTab = ref<'buy' | 'sell'>('buy');
const loading = ref(true);
const processing = ref(false);
const shopData = ref<ShopData | null>(null);
const sellableItems = ref<SellableItem[]>([]);
const selectedItem = ref<ShopItem | SellableItem | null>(null);
const quantity = ref(1);

const maxQuantity = computed(() => {
	if (!selectedItem.value) return 1;

	if (activeTab.value === 'buy') {
		const item = selectedItem.value as ShopItem;
		if (item.stock !== null) return item.stock;
		// Limit by player balance
		const balance = typeof props.playerBalance === 'string'
			? parseInt(props.playerBalance)
			: props.playerBalance;
		return Math.max(1, Math.floor(balance / item.buyPrice));
	} else {
		const item = selectedItem.value as SellableItem;
		return item.quantity;
	}
});

const canConfirm = computed(() => {
	if (!selectedItem.value) return false;

	if (activeTab.value === 'buy') {
		const item = selectedItem.value as ShopItem;
		if (!item.isAvailable) return false;
		if (item.stock !== null && item.stock < quantity.value) return false;
		const balance = typeof props.playerBalance === 'string'
			? parseInt(props.playerBalance)
			: props.playerBalance;
		return balance >= item.buyPrice * quantity.value;
	} else {
		const item = selectedItem.value as SellableItem;
		return item.quantity >= quantity.value;
	}
});

function formatBalance(value: number | string): string {
	const num = typeof value === 'string' ? parseInt(value) : value;
	return num.toLocaleString();
}

function rarityLabel(rarity: number): string {
	const labels = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];
	return labels[Math.min(rarity, labels.length - 1)];
}

function selectBuyItem(item: ShopItem): void {
	if (!item.isAvailable) return;
	selectedItem.value = item;
	quantity.value = 1;
}

function selectSellItem(item: SellableItem): void {
	selectedItem.value = item;
	quantity.value = 1;
}

async function loadShopData(): Promise<void> {
	loading.value = true;
	try {
		// In a real implementation, fetch from API
		// For now, use mock data
		shopData.value = {
			id: `shop_${props.interiorId}`,
			type: 'shopkeeper',
			name: '店主',
			greeting: 'いらっしゃいませ！何をお探しですか？',
			inventory: [],
		};
	} catch (e) {
		console.error('Failed to load shop data:', e);
	} finally {
		loading.value = false;
	}
}

async function loadSellableItems(): Promise<void> {
	loading.value = true;
	try {
		// In a real implementation, fetch player's sellable items
		sellableItems.value = [];
	} catch (e) {
		console.error('Failed to load sellable items:', e);
	} finally {
		loading.value = false;
	}
}

async function confirmTransaction(): Promise<void> {
	if (!selectedItem.value || processing.value) return;

	processing.value = true;
	try {
		if (activeTab.value === 'buy') {
			const item = selectedItem.value as ShopItem;
			const result = await misskeyApi('noctown/shop/buy', {
				interiorId: props.interiorId,
				inventoryItemId: item.id,
				quantity: quantity.value,
			});

			if (result.success && result.newBalance) {
				emit('balanceUpdated', result.newBalance);
				// Update stock
				if (item.stock !== null) {
					item.stock -= quantity.value;
					if (item.stock <= 0) {
						item.isAvailable = false;
					}
				}
			}
		} else {
			const item = selectedItem.value as SellableItem;
			const result = await misskeyApi('noctown/shop/sell', {
				interiorId: props.interiorId,
				playerItemId: item.id,
				quantity: quantity.value,
			});

			if (result.success && result.newBalance) {
				emit('balanceUpdated', result.newBalance);
				// Update quantity
				item.quantity -= quantity.value;
				if (item.quantity <= 0) {
					sellableItems.value = sellableItems.value.filter(i => i.id !== item.id);
				}
			}
		}

		selectedItem.value = null;
		quantity.value = 1;
	} catch (e) {
		console.error('Transaction failed:', e);
	} finally {
		processing.value = false;
	}
}

watch(activeTab, (newTab) => {
	selectedItem.value = null;
	quantity.value = 1;
	if (newTab === 'sell') {
		loadSellableItems();
	}
});

onMounted(() => {
	loadShopData();
});
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
}

.dialog {
	width: 90%;
	max-width: 480px;
	max-height: 80vh;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.npcInfo {
	display: flex;
	align-items: center;
	gap: 12px;
}

.npcAvatar {
	width: 48px;
	height: 48px;
	background: var(--MI_THEME-accent);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	color: white;
}

.npcText {
	display: flex;
	flex-direction: column;
}

.npcName {
	margin: 0;
	font-size: 16px;
	font-weight: bold;
}

.npcGreeting {
	margin: 4px 0 0;
	font-size: 13px;
	opacity: 0.7;
}

.closeBtn {
	background: none;
	border: none;
	padding: 8px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	&:hover {
		opacity: 1;
	}
}

.tabs {
	display: flex;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.tab {
	flex: 1;
	padding: 12px;
	background: none;
	border: none;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.activeTab {
	color: var(--MI_THEME-accent);
	border-bottom: 2px solid var(--MI_THEME-accent);
}

.balance {
	padding: 10px 16px;
	background: var(--MI_THEME-bg);
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
}

.balanceAmount {
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 32px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.itemList {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.unavailable {
	opacity: 0.5;
	cursor: not-allowed;
}

.itemImage {
	width: 40px;
	height: 40px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}
}

.itemInfo {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.itemName {
	font-size: 14px;
	font-weight: 500;
}

.itemRarity {
	font-size: 11px;
	opacity: 0.6;
}

.itemQuantity {
	font-size: 12px;
	opacity: 0.7;
}

.itemPrice {
	text-align: right;
}

.price {
	font-size: 14px;
	font-weight: bold;
	color: var(--MI_THEME-warn);
}

.sellPrice {
	font-size: 14px;
	font-weight: bold;
	color: var(--MI_THEME-success);
}

.stock {
	display: block;
	font-size: 11px;
	opacity: 0.6;
}

.selectedPanel {
	padding: 12px 16px;
	background: var(--MI_THEME-bg);
	border-top: 1px solid var(--MI_THEME-divider);
	display: flex;
	align-items: center;
	gap: 12px;
}

.selectedInfo {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.selectedName {
	font-size: 14px;
	font-weight: 500;
}

.selectedPrice {
	font-size: 16px;
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.quantityControl {
	display: flex;
	align-items: center;
	gap: 8px;
}

.quantityBtn {
	width: 28px;
	height: 28px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	&:not(:disabled):hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.quantityValue {
	min-width: 24px;
	text-align: center;
	font-weight: bold;
}

.confirmBtn {
	padding: 10px 20px;
	background: var(--MI_THEME-accent);
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-weight: bold;
	transition: opacity 0.15s;

	&:hover:not(:disabled) {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.processing {
	opacity: 0.7;
}
</style>
