<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- 仕様: イベント伝播を防止してキャンバスへの伝播を阻止 -->
<div :class="$style.inventory" @click.stop @mousedown.stop @touchstart.stop>
	<div :class="$style.header">
		<i class="ti ti-backpack"></i>
		<span>インベントリ</span>
		<button :class="$style.closeBtn" @click.stop="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			読込中...
		</div>
		<div v-else-if="items.length === 0" :class="$style.empty">
			空っぽ
		</div>
		<!-- グリッド表示 -->
		<div v-else :class="$style.grid">
			<div
				v-for="item in items"
				:key="item.id"
				:class="$style.item"
				:style="{ background: getRarityBackground(item.rarity) }"
				@click="selectItem(item)"
			>
				<div :class="$style.itemIcon">
					<img
						v-if="item.imageUrl"
						:src="item.imageUrl"
						:alt="item.itemName || 'item'"
						:class="$style.itemImage"
					/>
					<span v-else-if="item.emoji" :class="$style.itemEmoji">{{ item.emoji }}</span>
					<i v-else :class="getItemIcon(item.itemType)"></i>
				</div>
				<div :class="$style.itemQuantity">{{ item.quantity ?? 1 }}</div>
			</div>
		</div>
	</div>
	<div v-if="selectedItem" :class="$style.selectedInfo">
		<div :class="$style.selectedName">{{ selectedItem.itemName || 'Unknown Item' }}</div>
		<div :class="$style.selectedMeta">
			<!-- 仕様: インラインスタイルでレアリティ背景色を適用（動的CSSモジュール参照を回避） -->
			<span :class="$style.rarityBadge" :style="{ background: getRarityBadgeColor(selectedItem.rarity) }">{{ getRarityLabel(selectedItem.rarity) }}</span>
			<span>x{{ selectedItem.quantity ?? 1 }}</span>
		</div>
		<!-- 仕様: 数量選択（2個以上所持している場合のみ表示） -->
		<div v-if="(selectedItem.quantity ?? 1) > 1" :class="$style.quantitySelector">
			<span :class="$style.quantityLabel">数量:</span>
			<button :class="$style.quantityBtn" @click.stop="decrementDropQuantity" :disabled="dropQuantity <= 1">-</button>
			<span :class="$style.quantityValue">{{ dropQuantity }}</span>
			<button :class="$style.quantityBtn" @click.stop="incrementDropQuantity" :disabled="dropQuantity >= (selectedItem.quantity ?? 1)">+</button>
		</div>
	</div>
	<div v-if="selectedItem" :class="$style.actions">
		<MkButton :class="$style.actionBtn" @click.stop="placeItem">
			<i class="ti ti-box"></i> 設置
		</MkButton>
		<MkButton :class="$style.actionBtn" danger @click.stop="dropItem">
			<i class="ti ti-trash"></i> 捨てる{{ dropQuantity > 1 ? ` (${dropQuantity})` : '' }}
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkButton from '@/components/MkButton.vue';

// インベントリアイテムのインターフェース
// imageUrl: アイテム画像URL（nullの場合はitemTypeに基づくアイコンを表示）
// emoji: 仕様FR-030 画像がない場合のUnicode絵文字
// rarity: レアリティ（0:N, 1:R, 2:SR, 3:SSR, 4:UR, 5:LR）
interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	imageUrl: string | null;
	// 仕様: FR-030 画像がない場合のUnicode絵文字
	emoji: string | null;
	rarity: number;
	quantity: number;
	acquiredAt: string;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'place', item: InventoryItem): void;
	(e: 'drop', item: InventoryItem, quantity: number): void;
}>();

const loading = ref(true);
const items = ref<InventoryItem[]>([]);
const selectedItem = ref<InventoryItem | null>(null);
// 仕様: ドロップ時の数量（デフォルト1）
const dropQuantity = ref(1);

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function fetchInventory(): Promise<void> {
	try {
		loading.value = true;
		const token = getToken();
		if (!token) {
			items.value = [];
			return;
		}

		const res = await window.fetch('/api/noctown/item/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: token }),
		});

		if (res.ok) {
			const data = await res.json();
			// 仕様: APIレスポンスのバリデーション（配列かどうか確認）
			if (Array.isArray(data)) {
				// 各アイテムのデータを正規化（undefinedやnullを防止）
				items.value = data.map(item => ({
					id: item.id ?? '',
					itemId: item.itemId ?? '',
					itemName: item.itemName ?? 'Unknown Item',
					itemType: item.itemType ?? 'misc',
					imageUrl: item.imageUrl ?? null,
					// 仕様: FR-030 画像がない場合のUnicode絵文字
					emoji: item.emoji ?? null,
					rarity: typeof item.rarity === 'number' ? item.rarity : 0,
					quantity: typeof item.quantity === 'number' ? item.quantity : 1,
					acquiredAt: item.acquiredAt ?? '',
				}));
			} else {
				items.value = [];
			}
		} else {
			items.value = [];
		}
	} catch (e) {
		items.value = [];
	} finally {
		loading.value = false;
	}
}

// 仕様: アイテム選択時にドロップ数量を1にリセット
function selectItem(item: InventoryItem): void {
	if (selectedItem.value?.id === item.id) {
		selectedItem.value = null;
		dropQuantity.value = 1;
	} else {
		selectedItem.value = item;
		dropQuantity.value = 1;
	}
}

// 仕様: ドロップ数量を増加
function incrementDropQuantity(): void {
	if (selectedItem.value && dropQuantity.value < (selectedItem.value.quantity ?? 1)) {
		dropQuantity.value++;
	}
}

// 仕様: ドロップ数量を減少
function decrementDropQuantity(): void {
	if (dropQuantity.value > 1) {
		dropQuantity.value--;
	}
}

// itemTypeに基づくデフォルトアイコン
function getItemIcon(type: string): string {
	switch (type) {
		case 'tool': return 'ti ti-hammer';
		case 'skin': return 'ti ti-shirt';
		case 'placeable': return 'ti ti-box';
		case 'agent': return 'ti ti-robot';
		case 'seed': return 'ti ti-plant';
		case 'feed': return 'ti ti-meat';
		case 'house': return 'ti ti-home';
		case 'furniture': return 'ti ti-armchair';
		case 'wallpaper': return 'ti ti-photo';
		case 'frame': return 'ti ti-frame';
		default: return 'ti ti-package';
	}
}

// レアリティのラベル
function getRarityLabel(rarity: number): string {
	const labels = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];
	return labels[rarity] || 'N';
}

// 仕様: レアリティに対応するCSSクラス名を安全に取得
// rarityが範囲外の場合はrarity0（N）にフォールバック
function getRarityClass(rarity: number | undefined | null): string {
	const safeRarity = typeof rarity === 'number' && rarity >= 0 && rarity <= 5 ? rarity : 0;
	return `rarity${safeRarity}`;
}

// レアリティに対応する背景グラデーションを取得（アイテムグリッド用）
function getRarityBackground(rarity: number | undefined | null): string {
	const safeRarity = typeof rarity === 'number' && rarity >= 0 && rarity <= 5 ? rarity : 0;
	const backgrounds = [
		'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)', // N - グレー
		'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // R - 青
		'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', // SR - 紫
		'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // SSR - 金
		'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // UR - 赤
		'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // LR - ピンク
	];
	return backgrounds[safeRarity];
}

// 仕様: レアリティバッジ用の単色背景を取得（動的CSSモジュール参照を回避）
function getRarityBadgeColor(rarity: number | undefined | null): string {
	const safeRarity = typeof rarity === 'number' && rarity >= 0 && rarity <= 5 ? rarity : 0;
	const colors = ['#4a5568', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899'];
	return colors[safeRarity];
}

function placeItem(): void {
	if (selectedItem.value) {
		emit('place', selectedItem.value);
	}
}

// 仕様: アイテムを指定数量でドロップ
function dropItem(): void {
	if (selectedItem.value) {
		emit('drop', selectedItem.value, dropQuantity.value);
		selectedItem.value = null;
		dropQuantity.value = 1;
		fetchInventory();
	}
}

onMounted(async () => {
	try {
		await fetchInventory();
	} catch (e) {
		console.error('[MkNoctownInventory] onMounted error:', e);
	}
});

defineExpose({
	refresh: fetchInventory,
});
</script>

<style lang="scss" module>
// 仕様: z-indexを高く設定してThree.jsキャンバスより確実に上に表示
.inventory {
	position: absolute;
	right: 16px;
	top: 60px;
	width: 280px;
	max-height: 450px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	z-index: 10000;
}

.header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
}

.closeBtn {
	margin-left: auto;
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 12px;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 120px;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
	font-size: 14px;
}

// 正方形グリッドレイアウト
.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 8px;
}

// 正方形アイテムセル
.item {
	aspect-ratio: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.15s ease;
	background: var(--MI_THEME-bg);
	border: 2px solid transparent;

	&:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	&.selected {
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 2px var(--MI_THEME-accentedBg);
	}
}

// レアリティごとの背景色
.rarity0 { background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); } // N - グレー
.rarity1 { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); } // R - 青
.rarity2 { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); } // SR - 紫
.rarity3 { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); } // SSR - 金
.rarity4 { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); } // UR - 赤
.rarity5 { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); } // LR - ピンク

// アイコンコンテナ
.itemIcon {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28px;
	color: #fff;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

// アイテム画像
.itemImage {
	width: 80%;
	height: 80%;
	object-fit: contain;
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

// 仕様: FR-030 アイテム絵文字
.itemEmoji {
	font-size: 32px;
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

// 個数バッジ
.itemQuantity {
	position: absolute;
	bottom: 2px;
	right: 2px;
	background: rgba(0, 0, 0, 0.7);
	color: #fff;
	font-size: 10px;
	font-weight: bold;
	padding: 1px 4px;
	border-radius: 4px;
	min-width: 16px;
	text-align: center;
}

// 選択中アイテム情報
.selectedInfo {
	padding: 8px 12px;
	border-top: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
}

.selectedName {
	font-size: 14px;
	font-weight: 600;
	margin-bottom: 4px;
}

.selectedMeta {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	opacity: 0.8;
}

.rarityBadge {
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: bold;
	color: #fff;

	&.rarity0 { background: #4a5568; }
	&.rarity1 { background: #3b82f6; }
	&.rarity2 { background: #a855f7; }
	&.rarity3 { background: #f59e0b; }
	&.rarity4 { background: #ef4444; }
	&.rarity5 { background: #ec4899; }
}

// 仕様: 数量セレクター（2個以上所持時のみ表示）
.quantitySelector {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 8px;
	padding: 6px 0;
}

.quantityLabel {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
}

.quantityBtn {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-buttonBg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 16px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
}

.quantityValue {
	min-width: 32px;
	text-align: center;
	font-size: 14px;
	font-weight: 600;
	color: var(--MI_THEME-fg);
}

.actions {
	display: flex;
	gap: 8px;
	padding: 12px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.actionBtn {
	flex: 1;
}
</style>
