<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-list-check"></i>
		<span>クエスト</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else-if="quests.length === 0" :class="$style.empty">
			進行中のクエストはありません
		</div>
		<div v-else :class="$style.questList">
			<div
				v-for="quest in quests"
				:key="quest.id"
				:class="[$style.quest, { [$style.selected]: selectedQuest?.id === quest.id }]"
				@click="selectQuest(quest)"
			>
				<div :class="$style.questHeader">
					<div :class="$style.questType">
						<i :class="getQuestTypeIcon(quest.questType)"></i>
						<span>{{ getQuestTypeName(quest.questType) }}</span>
					</div>
					<div :class="$style.difficulty">
						<span v-for="i in quest.difficulty" :key="i" :class="$style.star">
							<i class="ti ti-star-filled"></i>
						</span>
					</div>
				</div>
				<div :class="$style.questDescription">
					{{ getQuestDescription(quest) }}
				</div>
				<div :class="$style.questReward">
					<span :class="$style.rewardCoins">
						<i class="ti ti-coin"></i>
						{{ quest.rewardCoins }} コイン
					</span>
					<span v-if="quest.rewardItemName" :class="$style.rewardItem">
						<i class="ti ti-gift"></i>
						{{ quest.rewardItemName }}
					</span>
				</div>
				<div v-if="quest.questType === 'deliver' && quest.destinationNpcName" :class="$style.questDestination">
					<i class="ti ti-map-pin"></i>
					配達先: {{ quest.destinationNpcName }}
				</div>
			</div>
		</div>
	</div>
	<div v-if="selectedQuest" :class="$style.actions">
		<MkButton :class="$style.actionBtn" @click="completeQuest">
			<i class="ti ti-check"></i> 報告する
		</MkButton>
		<MkButton :class="$style.actionBtn" danger @click="abandonQuest">
			<i class="ti ti-x"></i> 破棄する
		</MkButton>
	</div>

	<!-- Item selection for quest completion -->
	<div v-if="showItemSelect" :class="$style.itemSelectOverlay" @click.self="showItemSelect = false">
		<div :class="$style.itemSelectPanel">
			<div :class="$style.itemSelectHeader">
				<span>アイテムを選択</span>
				<button :class="$style.closeBtn" @click="showItemSelect = false">
					<i class="ti ti-x"></i>
				</button>
			</div>
			<div :class="$style.itemSelectContent">
				<div v-if="inventoryItems.length === 0" :class="$style.empty">
					アイテムがありません
				</div>
				<div v-else :class="$style.itemGrid">
					<div
						v-for="item in inventoryItems"
						:key="item.id"
						:class="$style.inventoryItem"
						@click="submitItem(item)"
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
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';

interface Quest {
	id: string;
	questType: string;
	difficulty: number;
	status: string;
	targetItemId: string | null;
	targetItemName: string | null;
	targetCondition: Record<string, string> | null;
	sourceNpcId: string;
	sourceNpcUsername: string | null;
	destinationNpcId: string | null;
	destinationNpcName: string | null;
	rewardCoins: number;
	rewardItemId: string | null;
	rewardItemName: string | null;
	startedAt: string;
}

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
	(e: 'questCompleted', questId: string, rewardCoins: number): void;
}>();

const loading = ref(true);
const quests = ref<Quest[]>([]);
const selectedQuest = ref<Quest | null>(null);
const showItemSelect = ref(false);
const inventoryItems = ref<InventoryItem[]>([]);

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function fetchQuests(): Promise<void> {
	try {
		loading.value = true;
		const res = await window.fetch('/api/noctown/quest/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			quests.value = await res.json();
		}
	} catch (e) {
		console.error('Failed to fetch quests:', e);
	} finally {
		loading.value = false;
	}
}

async function fetchInventory(): Promise<void> {
	try {
		const res = await window.fetch('/api/noctown/item/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			inventoryItems.value = await res.json();
		}
	} catch (e) {
		console.error('Failed to fetch inventory:', e);
	}
}

function selectQuest(quest: Quest): void {
	if (selectedQuest.value?.id === quest.id) {
		selectedQuest.value = null;
	} else {
		selectedQuest.value = quest;
	}
}

function getQuestTypeIcon(type: string): string {
	switch (type) {
		case 'collect': return 'ti ti-package';
		case 'deliver': return 'ti ti-truck';
		case 'find_name': return 'ti ti-search';
		case 'find_flavor': return 'ti ti-book';
		default: return 'ti ti-help';
	}
}

function getQuestTypeName(type: string): string {
	switch (type) {
		case 'collect': return '収集';
		case 'deliver': return '配達';
		case 'find_name': return '名前探し';
		case 'find_flavor': return 'テキスト探し';
		default: return '不明';
	}
}

function getQuestDescription(quest: Quest): string {
	switch (quest.questType) {
		case 'collect':
			return `「${quest.targetItemName ?? '特定のアイテム'}」を集めてきてください`;
		case 'find_name':
			if (quest.targetCondition?.nameContains) {
				return `「${quest.targetCondition.nameContains}」を含む名前のアイテムを見つけてください`;
			}
			return '特定の名前を持つアイテムを見つけてください';
		case 'find_flavor':
			if (quest.targetCondition?.flavorContains) {
				return `「${quest.targetCondition.flavorContains}」に関連するアイテムを見つけてください`;
			}
			return '特定の説明文を持つアイテムを見つけてください';
		case 'deliver':
			if (quest.targetItemName && quest.destinationNpcName) {
				return `「${quest.targetItemName}」を${quest.destinationNpcName}に届けてください`;
			}
			return 'アイテムを届けてください';
		default:
			return 'クエストを完了してください';
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

async function completeQuest(): Promise<void> {
	if (!selectedQuest.value) return;

	// Show item selection for quests that require items
	if (selectedQuest.value.questType !== 'deliver') {
		await fetchInventory();
		showItemSelect.value = true;
	}
}

async function submitItem(item: InventoryItem): Promise<void> {
	if (!selectedQuest.value) return;

	try {
		const res = await window.fetch('/api/noctown/quest/complete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				questId: selectedQuest.value.id,
				playerItemId: item.id,
			}),
		});

		if (res.ok) {
			const result = await res.json();
			emit('questCompleted', selectedQuest.value.id, result.rewardCoins ?? 0);
			showItemSelect.value = false;
			selectedQuest.value = null;
			await fetchQuests();
		} else {
			const error = await res.json();
			console.error('Quest completion failed:', error);
		}
	} catch (e) {
		console.error('Failed to complete quest:', e);
	}
}

async function abandonQuest(): Promise<void> {
	if (!selectedQuest.value) return;

	try {
		const res = await window.fetch('/api/noctown/quest/abandon', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				questId: selectedQuest.value.id,
			}),
		});

		if (res.ok) {
			selectedQuest.value = null;
			await fetchQuests();
		}
	} catch (e) {
		console.error('Failed to abandon quest:', e);
	}
}

onMounted(() => {
	fetchQuests();
});

defineExpose({
	refresh: fetchQuests,
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	left: 16px;
	top: 60px;
	width: 320px;
	max-height: 450px;
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

.questList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.quest {
	padding: 12px;
	border-radius: 8px;
	background: var(--MI_THEME-bg);
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.selected {
		background: var(--MI_THEME-accentedBg);
		border: 1px solid var(--MI_THEME-accent);
	}
}

.questHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.questType {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 500;
}

.difficulty {
	display: flex;
	gap: 2px;
}

.star {
	color: #ffc107;
	font-size: 12px;
}

.questDescription {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	margin-bottom: 8px;
	line-height: 1.4;
}

.questReward {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 12px;
}

.rewardCoins {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #ffc107;
}

.rewardItem {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #4ade80;
}

.questDestination {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	color: #a78bfa;
	margin-top: 6px;
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

.itemSelectOverlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 200;
}

.itemSelectPanel {
	width: 300px;
	max-height: 400px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
}

.itemSelectHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
}

.itemSelectContent {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.itemGrid {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.inventoryItem {
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
}

.itemIcon {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	font-size: 16px;
}

.itemInfo {
	flex: 1;
}

.itemName {
	font-size: 13px;
	font-weight: 500;
}

.itemQuantity {
	font-size: 11px;
	opacity: 0.6;
}
</style>
