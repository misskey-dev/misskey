<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
FR-032: 設置アイテム情報フローティングウィンドウ
- 設置アイテムをクリック/タップすると表示
- アイテム名、アイテムタイプ、設置者名を表示
- 自分が設置したアイテムの場合は「回収」ボタンを表示
-->

<template>
<div :class="$style.overlay" @click.self="handleClose" @keydown.escape="handleClose" tabindex="-1" ref="overlayRef">
	<div :class="$style.window">
		<button :class="$style.closeButton" @click="handleClose">
			<i class="ti ti-x"></i>
		</button>

		<div :class="$style.content">
			<!-- Item Icon -->
			<div :class="$style.iconWrapper" :style="{ background: getItemTypeColor(itemType) }">
				<i :class="[getItemIcon(itemType), $style.icon]"></i>
			</div>

			<!-- Item Name -->
			<div :class="$style.name">{{ itemName }}</div>

			<!-- Item Type Badge -->
			<div :class="$style.type">{{ getItemTypeLabel(itemType) }}</div>

			<!-- Owner info -->
			<div :class="$style.ownerInfo">
				<span :class="$style.ownerLabel">設置者:</span>
				<span :class="$style.ownerName">@{{ ownerUsername }}</span>
			</div>

			<!-- Pickup Button (only for own items) -->
			<div v-if="isOwner" :class="$style.actions">
				<MkButton :class="$style.pickupButton" @click="handlePickup" :disabled="isPickingUp">
					<i class="ti ti-package-import"></i>
					{{ isPickingUp ? '回収中...' : '回収する' }}
				</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkButton from '@/components/MkButton.vue';

const props = defineProps<{
	placedItemId: string;
	itemId: string;
	itemName: string;
	itemType: string;
	ownerId: string;
	ownerUsername: string;
	isOwner: boolean;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'pickup', placedItemId: string): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);
const isPickingUp = ref(false);

// アイテムタイプに対応するアイコン
function getItemIcon(type: string): string {
	switch (type) {
		case 'stone':
		case 'rock':
			return 'ti ti-boulder';
		case 'wood':
		case 'log':
			return 'ti ti-wood';
		case 'tool':
			return 'ti ti-hammer';
		case 'furniture':
			return 'ti ti-armchair';
		case 'decoration':
			return 'ti ti-flower';
		default:
			return 'ti ti-box';
	}
}

// アイテムタイプに対応する背景色
function getItemTypeColor(type: string): string {
	switch (type) {
		case 'stone':
		case 'rock':
			return 'linear-gradient(135deg, #808080, #5a5a5a)';
		case 'wood':
		case 'log':
			return 'linear-gradient(135deg, #8b4513, #654321)';
		case 'tool':
			return 'linear-gradient(135deg, #4a90d9, #2e5d8c)';
		case 'furniture':
			return 'linear-gradient(135deg, #9b59b6, #8e44ad)';
		case 'decoration':
			return 'linear-gradient(135deg, #27ae60, #1e8449)';
		default:
			return 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
	}
}

// アイテムタイプのラベル
function getItemTypeLabel(type: string): string {
	switch (type) {
		case 'stone':
		case 'rock':
			return '岩石';
		case 'wood':
		case 'log':
			return '木材';
		case 'tool':
			return '道具';
		case 'furniture':
			return '家具';
		case 'decoration':
			return '装飾';
		case 'normal':
			return 'アイテム';
		default:
			return type;
	}
}

function handleClose() {
	emit('close');
}

async function handlePickup() {
	if (isPickingUp.value) return;
	isPickingUp.value = true;
	emit('pickup', props.placedItemId);
}

onMounted(() => {
	overlayRef.value?.focus();
});
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	outline: none;
}

.window {
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	padding: 24px;
	min-width: 280px;
	max-width: 90vw;
	position: relative;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.closeButton {
	position: absolute;
	top: 8px;
	right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	border-radius: 50%;
	transition: background 0.15s, opacity 0.15s;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}

.iconWrapper {
	width: 80px;
	height: 80px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.icon {
	font-size: 40px;
	color: #fff;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.name {
	font-size: 20px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.type {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	padding: 4px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 12px;
}

.ownerInfo {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
}

.ownerLabel {
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	font-size: 13px;
}

.ownerName {
	color: var(--MI_THEME-accent);
	font-weight: 500;
	font-size: 14px;
}

.actions {
	margin-top: 16px;
	width: 100%;
}

.pickupButton {
	width: 100%;
}
</style>
