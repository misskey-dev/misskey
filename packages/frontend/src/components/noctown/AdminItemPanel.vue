<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.header">
		<h2 :class="$style.title">
			<i class="ti ti-shield"></i>
			アイテム管理
		</h2>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<!-- Tabs -->
	<div :class="$style.tabs">
		<button
			:class="[$style.tab, activeTab === 'create' && $style.activeTab]"
			@click="activeTab = 'create'"
		>
			<i class="ti ti-plus"></i>
			新規作成
		</button>
		<button
			:class="[$style.tab, activeTab === 'distribute' && $style.activeTab]"
			@click="activeTab = 'distribute'"
		>
			<i class="ti ti-send"></i>
			配布
		</button>
		<button
			:class="[$style.tab, activeTab === 'list' && $style.activeTab]"
			@click="activeTab = 'list'"
		>
			<i class="ti ti-list"></i>
			一覧
		</button>
	</div>

	<div :class="$style.content">
		<!-- Create Tab -->
		<div v-if="activeTab === 'create'" :class="$style.form">
			<div :class="$style.field">
				<label>アイテム名 *</label>
				<input v-model="newItem.name" type="text" :class="$style.input" maxlength="128" />
			</div>

			<div :class="$style.field">
				<label>フレーバーテキスト</label>
				<textarea v-model="newItem.flavorText" :class="$style.textarea" maxlength="1000"></textarea>
			</div>

			<div :class="$style.row">
				<div :class="$style.field">
					<label>レアリティ</label>
					<select v-model="newItem.rarity" :class="$style.select">
						<option :value="0">N (ノーマル)</option>
						<option :value="1">R (レア)</option>
						<option :value="2">SR (スーパーレア)</option>
						<option :value="3">SSR (超スーパーレア)</option>
						<option :value="4">UR (ウルトラレア)</option>
						<option :value="5">LR (レジェンダリー)</option>
					</select>
				</div>

				<div :class="$style.field">
					<label>アイテムタイプ</label>
					<select v-model="newItem.itemType" :class="$style.select">
						<option value="normal">通常</option>
						<option value="tool">ツール</option>
						<option value="skin">スキン</option>
						<option value="placeable">設置可能</option>
						<option value="seed">種</option>
						<option value="feed">餌</option>
					</select>
				</div>
			</div>

			<div :class="$style.row">
				<div :class="$style.field">
					<label>画像URL</label>
					<input v-model="newItem.imageUrl" type="text" :class="$style.input" placeholder="https://..." />
				</div>
			</div>

			<div :class="$style.row">
				<div :class="$style.field">
					<label>ショップ購入価格</label>
					<input v-model.number="newItem.shopPrice" type="number" :class="$style.input" min="0" />
				</div>

				<div :class="$style.field">
					<label>ショップ売却価格</label>
					<input v-model.number="newItem.shopSellPrice" type="number" :class="$style.input" min="0" />
				</div>
			</div>

			<div :class="$style.field">
				<label>
					<input v-model="newItem.isUnique" type="checkbox" />
					ユニークアイテム (1個のみ存在)
				</label>
			</div>

			<button
				:class="[$style.submitBtn, !canCreate && $style.disabled]"
				:disabled="!canCreate || isCreating"
				@click="createItem"
			>
				<template v-if="isCreating">
					<MkLoading :em="true"/>
				</template>
				<template v-else>
					<i class="ti ti-plus"></i>
					アイテムを作成
				</template>
			</button>

			<div v-if="createMessage" :class="[$style.message, createSuccess ? $style.success : $style.error]">
				{{ createMessage }}
			</div>
		</div>

		<!-- Distribute Tab -->
		<div v-if="activeTab === 'distribute'" :class="$style.form">
			<div :class="$style.field">
				<label>配布するアイテムID *</label>
				<input v-model="distribute.itemId" type="text" :class="$style.input" />
			</div>

			<div :class="$style.field">
				<label>数量</label>
				<input v-model.number="distribute.quantity" type="number" :class="$style.input" min="1" max="9999" />
			</div>

			<div :class="$style.field">
				<label>
					<input v-model="distribute.toAll" type="checkbox" />
					全プレイヤーに配布
				</label>
			</div>

			<div v-if="!distribute.toAll" :class="$style.field">
				<label>対象プレイヤーID (1行に1つ)</label>
				<textarea
					v-model="distribute.playerIds"
					:class="$style.textarea"
					placeholder="プレイヤーIDを入力..."
				></textarea>
			</div>

			<button
				:class="[$style.submitBtn, !canDistribute && $style.disabled]"
				:disabled="!canDistribute || isDistributing"
				@click="distributeItems"
			>
				<template v-if="isDistributing">
					<MkLoading :em="true"/>
				</template>
				<template v-else>
					<i class="ti ti-send"></i>
					配布する
				</template>
			</button>

			<div v-if="distributeMessage" :class="[$style.message, distributeSuccess ? $style.success : $style.error]">
				{{ distributeMessage }}
			</div>
		</div>

		<!-- List Tab -->
		<div v-if="activeTab === 'list'" :class="$style.listContent">
			<div v-if="isLoadingItems" :class="$style.loading">
				<MkLoading/>
			</div>

			<div v-else-if="items.length === 0" :class="$style.empty">
				<p>カスタムアイテムがありません</p>
			</div>

			<div v-else :class="$style.itemList">
				<div v-for="item in items" :key="item.id" :class="$style.itemRow">
					<div :class="$style.itemInfo">
						<span :class="$style.itemName">{{ item.name }}</span>
						<span :class="[$style.itemRarity, `rarity-${item.rarity}`]">
							{{ getRarityName(item.rarity) }}
						</span>
					</div>
					<span :class="$style.itemId">{{ item.id }}</span>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

interface ItemData {
	id: string;
	name: string;
	rarity: number;
	itemType: string;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'item-created', id: string): void;
}>();

const activeTab = ref<'create' | 'distribute' | 'list'>('create');

// Create form
const newItem = ref({
	name: '',
	flavorText: '',
	imageUrl: '',
	rarity: 0,
	itemType: 'normal',
	isUnique: false,
	shopPrice: null as number | null,
	shopSellPrice: null as number | null,
});
const isCreating = ref(false);
const createMessage = ref('');
const createSuccess = ref(false);

// Distribute form
const distribute = ref({
	itemId: '',
	quantity: 1,
	toAll: false,
	playerIds: '',
});
const isDistributing = ref(false);
const distributeMessage = ref('');
const distributeSuccess = ref(false);

// Item list
const items = ref<ItemData[]>([]);
const isLoadingItems = ref(false);

const canCreate = computed(() => newItem.value.name.trim().length > 0);
const canDistribute = computed(() => {
	if (!distribute.value.itemId) return false;
	if (!distribute.value.toAll && !distribute.value.playerIds.trim()) return false;
	return true;
});

const RARITY_NAMES = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];

function getRarityName(rarity: number): string {
	return RARITY_NAMES[rarity] ?? 'N';
}

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function createItem(): Promise<void> {
	if (!canCreate.value || isCreating.value) return;

	isCreating.value = true;
	createMessage.value = '';

	try {
		const res = await window.fetch('/api/noctown/admin/item/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				name: newItem.value.name,
				flavorText: newItem.value.flavorText || null,
				imageUrl: newItem.value.imageUrl || null,
				rarity: newItem.value.rarity,
				itemType: newItem.value.itemType,
				isUnique: newItem.value.isUnique,
				shopPrice: newItem.value.shopPrice,
				shopSellPrice: newItem.value.shopSellPrice,
			}),
		});

		if (!res.ok) {
			const error = await res.json();
			throw new Error(error.error?.message ?? 'Failed to create item');
		}

		const result = await res.json();
		createSuccess.value = true;
		createMessage.value = `アイテム "${result.name}" を作成しました (ID: ${result.id})`;

		// Reset form
		newItem.value = {
			name: '',
			flavorText: '',
			imageUrl: '',
			rarity: 0,
			itemType: 'normal',
			isUnique: false,
			shopPrice: null,
			shopSellPrice: null,
		};

		emit('item-created', result.id);
	} catch (e) {
		createSuccess.value = false;
		createMessage.value = e instanceof Error ? e.message : 'エラーが発生しました';
	} finally {
		isCreating.value = false;
	}
}

async function distributeItems(): Promise<void> {
	if (!canDistribute.value || isDistributing.value) return;

	isDistributing.value = true;
	distributeMessage.value = '';

	try {
		const targetPlayerIds = distribute.value.toAll
			? undefined
			: distribute.value.playerIds.split('\n').map(id => id.trim()).filter(id => id);

		const res = await window.fetch('/api/noctown/admin/item/distribute', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				itemId: distribute.value.itemId,
				quantity: distribute.value.quantity,
				targetPlayerIds,
				distributeToAll: distribute.value.toAll,
			}),
		});

		if (!res.ok) {
			const error = await res.json();
			throw new Error(error.error?.message ?? 'Failed to distribute items');
		}

		const result = await res.json();
		distributeSuccess.value = true;
		distributeMessage.value = `${result.distributedCount}人のプレイヤーにアイテムを配布しました`;
	} catch (e) {
		distributeSuccess.value = false;
		distributeMessage.value = e instanceof Error ? e.message : 'エラーが発生しました';
	} finally {
		isDistributing.value = false;
	}
}

async function loadItems(): Promise<void> {
	isLoadingItems.value = true;

	try {
		// This would call an API to list custom items
		// For now, we'll leave it empty as the list API isn't implemented
		items.value = [];
	} catch (e) {
		console.error('Failed to load items:', e);
	} finally {
		isLoadingItems.value = false;
	}
}

onMounted(() => {
	if (activeTab.value === 'list') {
		loadItems();
	}
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	height: 100%;
	max-height: 700px;
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
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 12px;
	background: none;
	border: none;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	transition: all 0.15s;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.activeTab {
	opacity: 1;
	border-bottom: 2px solid var(--MI_THEME-accent);
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 6px;

	label {
		font-size: 13px;
		font-weight: 500;
	}
}

.row {
	display: flex;
	gap: 12px;

	> .field {
		flex: 1;
	}
}

.input, .select, .textarea {
	padding: 10px;
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 14px;
}

.textarea {
	min-height: 80px;
	resize: vertical;
}

.submitBtn {
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

.message {
	padding: 10px;
	border-radius: 6px;
	font-size: 13px;
}

.success {
	background: rgba(34, 197, 94, 0.1);
	color: #22c55e;
}

.error {
	background: rgba(239, 68, 68, 0.1);
	color: #ef4444;
}

.listContent {
	height: 100%;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.itemList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.itemRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
}

.itemInfo {
	display: flex;
	align-items: center;
	gap: 8px;
}

.itemName {
	font-weight: 600;
}

.itemRarity {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 600;

	&.rarity-0 { background: #9ca3af; color: white; }
	&.rarity-1 { background: #22c55e; color: white; }
	&.rarity-2 { background: #3b82f6; color: white; }
	&.rarity-3 { background: #a855f7; color: white; }
	&.rarity-4 { background: #f59e0b; color: white; }
	&.rarity-5 { background: #ef4444; color: white; }
}

.itemId {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
	font-family: monospace;
}
</style>
