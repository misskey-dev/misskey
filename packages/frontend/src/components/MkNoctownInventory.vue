<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.inventory">
	<div :class="$style.header">
		<i class="ti ti-backpack"></i>
		<span>インベントリ</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else-if="items.length === 0" :class="$style.empty">
			アイテムがありません
		</div>
		<div v-else :class="$style.grid">
			<div
				v-for="item in items"
				:key="item.id"
				:class="[$style.item, { [$style.selected]: selectedItem?.id === item.id }]"
				@click="selectItem(item)"
			>
				<div :class="$style.itemIcon">
					<i :class="getItemIcon(item.itemType)"></i>
				</div>
				<div :class="$style.itemInfo">
					<div :class="$style.itemName">{{ item.itemName }}</div>
					<div :class="$style.itemQuantity">x{{ item.quantity }}</div>
				</div>
			</div>
		</div>
	</div>
	<div v-if="selectedItem" :class="$style.actions">
		<MkButton :class="$style.actionBtn" @click="placeItem">
			<i class="ti ti-box"></i> 設置
		</MkButton>
		<MkButton :class="$style.actionBtn" danger @click="dropItem">
			<i class="ti ti-trash"></i> 捨てる
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
	acquiredAt: string;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'place', item: InventoryItem): void;
	(e: 'drop', item: InventoryItem): void;
}>();

const loading = ref(true);
const items = ref<InventoryItem[]>([]);
const selectedItem = ref<InventoryItem | null>(null);

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
		const res = await window.fetch('/api/noctown/item/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			items.value = await res.json();
		}
	} catch (e) {
		console.error('Failed to fetch inventory:', e);
	} finally {
		loading.value = false;
	}
}

function selectItem(item: InventoryItem): void {
	if (selectedItem.value?.id === item.id) {
		selectedItem.value = null;
	} else {
		selectedItem.value = item;
	}
}

function getItemIcon(type: string): string {
	switch (type) {
		case 'tool': return 'ti ti-hammer';
		case 'skin': return 'ti ti-shirt';
		case 'placeable': return 'ti ti-box';
		case 'agent': return 'ti ti-robot';
		case 'seed': return 'ti ti-plant';
		case 'feed': return 'ti ti-meat';
		default: return 'ti ti-package';
	}
}

function placeItem(): void {
	if (selectedItem.value) {
		emit('place', selectedItem.value);
	}
}

function dropItem(): void {
	if (selectedItem.value) {
		emit('drop', selectedItem.value);
		selectedItem.value = null;
		fetchInventory();
	}
}

onMounted(() => {
	fetchInventory();
});

defineExpose({
	refresh: fetchInventory,
});
</script>

<style lang="scss" module>
.inventory {
	position: absolute;
	right: 16px;
	top: 60px;
	width: 300px;
	max-height: 400px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	z-index: 100;
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
	padding: 8px;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.grid {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	border-radius: 6px;
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.selected {
		background: var(--MI_THEME-accentedBg);
	}
}

.itemIcon {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	font-size: 18px;
}

.itemInfo {
	flex: 1;
}

.itemName {
	font-size: 14px;
	font-weight: 500;
}

.itemQuantity {
	font-size: 12px;
	opacity: 0.6;
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
