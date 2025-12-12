<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	:width="380"
	:height="480"
	@close="close"
	@closed="close"
>
	<template #header>
		<span class="header-title">アイテム詳細</span>
	</template>

	<div :class="$style.container">
		<div v-if="isLoading" :class="$style.loading">
			<MkLoading/>
		</div>

		<template v-else-if="item">
			<!-- Item Image -->
			<div :class="[$style.imageSection, $style[`rarity${item.rarity}`]]">
				<div :class="$style.imageWrapper">
					<img
						v-if="item.fullImageUrl || item.imageUrl"
						:src="item.fullImageUrl || item.imageUrl || undefined"
						:alt="item.name"
						:class="$style.itemImage"
					/>
					<div v-else :class="$style.imagePlaceholder">
						<i class="ti ti-package"></i>
					</div>
				</div>
				<div :class="$style.rarityBadge" :style="{ background: getRarityColor(item.rarity) }">
					{{ item.rarityName }}
				</div>
			</div>

			<!-- Item Info -->
			<div :class="$style.infoSection">
				<h2 :class="$style.itemName" :style="{ color: getRarityColor(item.rarity) }">
					{{ item.name }}
				</h2>

				<div :class="$style.tags">
					<span :class="$style.typeTag">{{ getTypeName(item.itemType) }}</span>
					<span v-if="item.isUnique" :class="[$style.tag, $style.uniqueTag]">
						<i class="ti ti-star-filled"></i>
						ユニーク
					</span>
					<span v-if="item.isPlayerCreated" :class="[$style.tag, $style.playerTag]">
						<i class="ti ti-user"></i>
						プレイヤー作
					</span>
				</div>

				<!-- Flavor Text -->
				<div v-if="item.flavorText" :class="$style.flavorText">
					<i class="ti ti-quote"></i>
					{{ item.flavorText }}
				</div>

				<!-- Prices -->
				<div :class="$style.priceSection">
					<div v-if="item.shopPrice !== null" :class="$style.priceRow">
						<span :class="$style.priceLabel">購入価格</span>
						<span :class="$style.priceValue">
							<i class="ti ti-coin"></i>
							{{ item.shopPrice.toLocaleString() }}
						</span>
					</div>
					<div v-if="item.shopSellPrice !== null" :class="$style.priceRow">
						<span :class="$style.priceLabel">売却価格</span>
						<span :class="$style.priceValue">
							<i class="ti ti-coin"></i>
							{{ item.shopSellPrice.toLocaleString() }}
						</span>
					</div>
				</div>

				<!-- Owned Quantity -->
				<div v-if="item.ownedQuantity !== null" :class="$style.ownedSection">
					<span :class="$style.ownedLabel">所持数</span>
					<span :class="$style.ownedValue">{{ item.ownedQuantity }}</span>
				</div>
			</div>
		</template>

		<div v-else :class="$style.error">
			<i class="ti ti-alert-circle"></i>
			<p>アイテム情報を取得できませんでした</p>
		</div>

		<!-- Actions -->
		<div :class="$style.actions">
			<MkButton @click="close">閉じる</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

interface ItemDetail {
	id: string;
	name: string;
	flavorText: string | null;
	itemType: string;
	rarity: number;
	rarityName: string;
	isUnique: boolean;
	isPlayerCreated: boolean;
	shopPrice: number | null;
	shopSellPrice: number | null;
	imageUrl: string | null;
	fullImageUrl: string | null;
	ownedQuantity: number | null;
}

const props = defineProps<{
	itemId?: string;
	playerItemId?: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
}>();

const isLoading = ref(true);
const item = ref<ItemDetail | null>(null);

// Rarity colors
const rarityColors: Record<number, string> = {
	0: '#8b8b8b', // Normal
	1: '#2ecc71', // Rare
	2: '#3498db', // Super Rare
	3: '#9b59b6', // Super Super Rare
	4: '#f39c12', // Ultra Rare
	5: '#e74c3c', // Legendary Rare
};

// Type names
const typeNames: Record<string, string> = {
	normal: '通常',
	tool: 'ツール',
	skin: 'スキン',
	placeable: '設置可能',
	agent: 'エージェント',
	seed: '種',
	feed: 'エサ',
};

function getRarityColor(rarity: number): string {
	return rarityColors[rarity] ?? rarityColors[0];
}

function getTypeName(type: string): string {
	return typeNames[type] ?? type;
}

async function loadItemDetail() {
	isLoading.value = true;

	try {
		const params: { itemId?: string; playerItemId?: string } = {};
		if (props.playerItemId) {
			params.playerItemId = props.playerItemId;
		} else if (props.itemId) {
			params.itemId = props.itemId;
		}

		item.value = await misskeyApi('noctown/item/detail', params);
	} catch (e) {
		console.error('Failed to load item detail:', e);
		item.value = null;
	} finally {
		isLoading.value = false;
	}
}

function close() {
	emit('close');
}

onMounted(() => {
	loadItemDetail();
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px;
	overflow-y: auto;
}

.loading, .error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	i {
		font-size: 48px;
		margin-bottom: 12px;
	}
}

.imageSection {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 24px;
	border-radius: 12px;
	margin-bottom: 16px;
	background: var(--MI_THEME-bg);

	&.rarity0 { background: linear-gradient(135deg, rgba(139, 139, 139, 0.1), rgba(139, 139, 139, 0.2)); }
	&.rarity1 { background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(46, 204, 113, 0.2)); }
	&.rarity2 { background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.2)); }
	&.rarity3 { background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(155, 89, 182, 0.2)); }
	&.rarity4 { background: linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(243, 156, 18, 0.2)); }
	&.rarity5 { background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.2)); }
}

.imageWrapper {
	width: 120px;
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.itemImage {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
	border-radius: 8px;
}

.imagePlaceholder {
	width: 80px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	font-size: 32px;
	color: var(--MI_THEME-fg);
	opacity: 0.4;
}

.rarityBadge {
	position: absolute;
	top: 12px;
	right: 12px;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	color: white;
}

.infoSection {
	flex: 1;
}

.itemName {
	margin: 0 0 8px 0;
	font-size: 20px;
	font-weight: bold;
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
}

.typeTag {
	padding: 4px 10px;
	background: var(--MI_THEME-accentedBg);
	border-radius: 4px;
	font-size: 12px;
	color: var(--MI_THEME-accent);
}

.tag {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 4px;
	font-size: 12px;
}

.uniqueTag {
	background: rgba(243, 156, 18, 0.15);
	color: #f39c12;
}

.playerTag {
	background: rgba(155, 89, 182, 0.15);
	color: #9b59b6;
}

.flavorText {
	display: flex;
	gap: 8px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	margin-bottom: 16px;
	font-style: italic;
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	line-height: 1.5;

	i {
		color: var(--MI_THEME-accent);
		opacity: 0.6;
	}
}

.priceSection {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 16px;
}

.priceRow {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
}

.priceLabel {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.priceValue {
	display: flex;
	align-items: center;
	gap: 4px;
	font-weight: 600;
	color: #f59e0b;
}

.ownedSection {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-accentedBg);
	border-radius: 8px;
	margin-bottom: 16px;
}

.ownedLabel {
	font-size: 14px;
	color: var(--MI_THEME-fg);
}

.ownedValue {
	font-size: 20px;
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid var(--MI_THEME-divider);
}
</style>
