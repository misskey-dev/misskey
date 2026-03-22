<script setup lang="ts">
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, onMounted } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

interface Quest {
	id: string;
	questType: 'collect' | 'deliver' | 'find_name' | 'find_flavor';
	difficulty: number;
	status: 'active' | 'completed' | 'abandoned' | 'expired';
	targetItemId: string | null;
	targetItemName: string | null;
	targetCondition: Record<string, string> | null;
	sourceNpcId: string;
	sourceNpcName: string | null;
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
	flavorText?: string;
}

const props = defineProps<{
	playerId: string;
	currentNpcId?: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'questCompleted', data: { rewardCoins: number; rewardItemName?: string }): void;
}>();

const isLoading = ref(true);
const quests = ref<Quest[]>([]);
const inventory = ref<InventoryItem[]>([]);
const selectedQuest = ref<Quest | null>(null);
const selectedItem = ref<InventoryItem | null>(null);
const isCompleting = ref(false);
const isAbandoning = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const activeQuests = computed(() => quests.value.filter(q => q.status === 'active'));
const completedQuests = computed(() => quests.value.filter(q => q.status === 'completed').slice(0, 5));

const questTypeLabels: Record<string, string> = {
	collect: 'Collect',
	deliver: 'Deliver',
	find_name: 'Find by Name',
	find_flavor: 'Find by Description',
};

const difficultyStars = (difficulty: number) => {
	return Array(5).fill(0).map((_, i) => i < difficulty ? 'filled' : 'empty');
};

onMounted(async () => {
	await Promise.all([loadQuests(), loadInventory()]);
});

async function loadQuests() {
	isLoading.value = true;
	error.value = null;

	try {
		const res = await window.fetch('/api/noctown/quest/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});
		if (res.ok) {
			quests.value = await res.json();
		}
	} catch (err) {
		error.value = 'Failed to load quests';
		console.error('Failed to load quests:', err);
	} finally {
		isLoading.value = false;
	}
}

async function loadInventory() {
	try {
		const res = await window.fetch('/api/noctown/item/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});
		if (res.ok) {
			inventory.value = await res.json();
		}
	} catch (err) {
		console.error('Failed to load inventory:', err);
	}
}

function selectQuest(quest: Quest) {
	selectedQuest.value = selectedQuest.value?.id === quest.id ? null : quest;
	selectedItem.value = null;
}

function selectItem(item: InventoryItem) {
	selectedItem.value = selectedItem.value?.id === item.id ? null : item;
}

function getMatchingItems(quest: Quest): InventoryItem[] {
	if (quest.questType === 'collect' || quest.questType === 'deliver') {
		return inventory.value.filter(item => item.itemId === quest.targetItemId);
	} else if (quest.questType === 'find_name' && quest.targetCondition?.nameContains) {
		return inventory.value.filter(item =>
			item.itemName.includes(quest.targetCondition!.nameContains)
		);
	} else if (quest.questType === 'find_flavor' && quest.targetCondition?.flavorContains) {
		return inventory.value.filter(item =>
			item.flavorText?.includes(quest.targetCondition!.flavorContains)
		);
	}
	return [];
}

function canCompleteQuest(quest: Quest): boolean {
	if (quest.status !== 'active') return false;

	// For deliver quests, check if we're at the right NPC
	if (quest.questType === 'deliver') {
		if (!props.currentNpcId || props.currentNpcId !== quest.destinationNpcId) {
			return false;
		}
	}

	// Check if we have matching items
	return getMatchingItems(quest).length > 0;
}

function getQuestDescription(quest: Quest): string {
	switch (quest.questType) {
		case 'collect':
			return `Collect and deliver: ${quest.targetItemName ?? 'Unknown Item'}`;
		case 'deliver':
			return `Deliver ${quest.targetItemName ?? 'item'} to ${quest.destinationNpcName ?? 'NPC'}`;
		case 'find_name':
			return `Find an item with "${quest.targetCondition?.nameContains ?? '???'}" in its name`;
		case 'find_flavor':
			return `Find an item with "${quest.targetCondition?.flavorContains ?? '???'}" in its description`;
		default:
			return 'Unknown quest type';
	}
}

async function completeQuest() {
	if (!selectedQuest.value || !selectedItem.value || isCompleting.value) return;

	isCompleting.value = true;
	error.value = null;
	successMessage.value = null;

	try {
		const params: Record<string, string | null | undefined> = {
			i: getToken(),
			questId: selectedQuest.value.id,
			playerItemId: selectedItem.value.id,
		};

		// Add npcId for deliver quests
		if (selectedQuest.value.questType === 'deliver' && props.currentNpcId) {
			params.npcId = props.currentNpcId;
		}

		const res = await window.fetch('/api/noctown/quest/complete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify(params),
		});

		if (res.ok) {
			const result = await res.json() as {
				success: boolean;
				rewardCoins?: number;
				rewardItemName?: string;
			};

			if (result.success) {
				let message = `Quest completed! +${result.rewardCoins} coins`;
				if (result.rewardItemName) {
					message += ` + ${result.rewardItemName}`;
				}
				successMessage.value = message;

				emit('questCompleted', {
					rewardCoins: result.rewardCoins ?? 0,
					rewardItemName: result.rewardItemName,
				});

				selectedQuest.value = null;
				selectedItem.value = null;

				await Promise.all([loadQuests(), loadInventory()]);

				setTimeout(() => {
					successMessage.value = null;
				}, 3000);
			}
		} else {
			const errData = await res.json();
			if (errData.error?.code === 'WRONG_NPC') {
				error.value = 'You must talk to the destination NPC to complete this delivery';
			} else if (errData.error?.code === 'WRONG_ITEM') {
				error.value = 'This item does not match the quest requirements';
			} else if (errData.error?.code === 'CONDITION_NOT_MET') {
				error.value = 'Item does not meet the quest condition';
			} else {
				error.value = 'Failed to complete quest';
			}
		}
	} catch (err) {
		error.value = 'Failed to complete quest';
		console.error('Failed to complete quest:', err);
	} finally {
		isCompleting.value = false;
	}
}

async function abandonQuest(quest: Quest) {
	if (isAbandoning.value) return;
	if (!confirm('Abandon this quest? You will not receive any rewards.')) return;

	isAbandoning.value = true;
	error.value = null;

	try {
		const res = await window.fetch('/api/noctown/quest/abandon', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken(), questId: quest.id }),
		});

		if (res.ok) {
			if (selectedQuest.value?.id === quest.id) {
				selectedQuest.value = null;
			}
			await loadQuests();
		} else {
			error.value = 'Failed to abandon quest';
		}
	} catch (err) {
		error.value = 'Failed to abandon quest';
		console.error('Failed to abandon quest:', err);
	} finally {
		isAbandoning.value = false;
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function close() {
	emit('close');
}
</script>

<template>
	<MkModalWindow
		:width="600"
		:height="700"
		@close="close"
		@closed="close"
	>
		<template #header>
			<span class="header-title">Quests ({{ activeQuests.length }}/5)</span>
		</template>

		<div class="quest-panel">
			<!-- Messages -->
			<div v-if="error" class="error-message">
				{{ error }}
			</div>
			<div v-if="successMessage" class="success-message">
				{{ successMessage }}
			</div>

			<!-- Active Quests Section -->
			<section class="quests-section">
				<h3 class="section-title">Active Quests</h3>

				<div v-if="isLoading" class="loading">
					Loading quests...
				</div>

				<div v-else-if="activeQuests.length === 0" class="no-quests">
					<span>No active quests</span>
					<p class="hint">Talk to NPCs to receive quests!</p>
				</div>

				<div v-else class="quests-list">
					<div
						v-for="quest in activeQuests"
						:key="quest.id"
						class="quest-card"
						:class="{ selected: selectedQuest?.id === quest.id }"
						@click="selectQuest(quest)"
					>
						<div class="quest-header">
							<span class="quest-type" :class="quest.questType">
								{{ questTypeLabels[quest.questType] }}
							</span>
							<div class="quest-difficulty">
								<span
									v-for="(star, idx) in difficultyStars(quest.difficulty)"
									:key="idx"
									class="star"
									:class="star"
								>*</span>
							</div>
						</div>

						<div class="quest-description">
							{{ getQuestDescription(quest) }}
						</div>

						<div class="quest-info">
							<span class="quest-from">From: {{ quest.sourceNpcName ?? 'Unknown' }}</span>
							<span class="quest-time">{{ formatDate(quest.startedAt) }}</span>
						</div>

						<div class="quest-rewards">
							<span class="reward-coins">{{ quest.rewardCoins }} coins</span>
							<span v-if="quest.rewardItemName" class="reward-item">
								+ {{ quest.rewardItemName }}
							</span>
						</div>

						<!-- Expanded Details -->
						<div v-if="selectedQuest?.id === quest.id" class="quest-details">
							<div class="details-divider"></div>

							<!-- Deliver quest location hint -->
							<div v-if="quest.questType === 'deliver'" class="deliver-hint">
								<span v-if="props.currentNpcId === quest.destinationNpcId" class="at-destination">
									You are at the destination!
								</span>
								<span v-else class="not-at-destination">
									Go to: {{ quest.destinationNpcName ?? 'destination NPC' }}
								</span>
							</div>

							<!-- Matching Items -->
							<div class="matching-items">
								<span class="items-label">Matching items in inventory:</span>
								<div v-if="getMatchingItems(quest).length === 0" class="no-items">
									No matching items found
								</div>
								<div v-else class="items-list">
									<button
										v-for="item in getMatchingItems(quest)"
										:key="item.id"
										class="item-button"
										:class="{ selected: selectedItem?.id === item.id }"
										@click.stop="selectItem(item)"
									>
										{{ item.itemName }} (x{{ item.quantity }})
									</button>
								</div>
							</div>

							<!-- Actions -->
							<div class="quest-actions">
								<MkButton
									primary
									:disabled="!canCompleteQuest(quest) || !selectedItem || isCompleting"
									@click.stop="completeQuest"
								>
									{{ isCompleting ? 'Completing...' : 'Complete Quest' }}
								</MkButton>
								<MkButton
									danger
									:disabled="isAbandoning"
									@click.stop="abandonQuest(quest)"
								>
									Abandon
								</MkButton>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Completed Quests Section -->
			<section v-if="completedQuests.length > 0" class="completed-section">
				<h3 class="section-title">Recently Completed</h3>
				<div class="completed-list">
					<div
						v-for="quest in completedQuests"
						:key="quest.id"
						class="completed-quest"
					>
						<span class="quest-type-mini" :class="quest.questType">
							{{ questTypeLabels[quest.questType] }}
						</span>
						<span class="quest-desc-mini">{{ getQuestDescription(quest) }}</span>
						<span class="quest-reward-mini">+{{ quest.rewardCoins }}</span>
					</div>
				</div>
			</section>

			<!-- Close Button -->
			<div class="actions">
				<MkButton @click="close">
					Close
				</MkButton>
			</div>
		</div>
	</MkModalWindow>
</template>

<style lang="scss" scoped>
.quest-panel {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	height: 100%;
	overflow: hidden;
}

.section-title {
	font-size: 14px;
	font-weight: bold;
	color: var(--fg);
	margin: 0 0 12px 0;
	padding-bottom: 8px;
	border-bottom: 1px solid var(--divider);
}

.error-message {
	padding: 12px;
	background: rgba(255, 0, 0, 0.1);
	color: #ff4444;
	border-radius: 8px;
	text-align: center;
}

.success-message {
	padding: 12px;
	background: rgba(0, 255, 0, 0.1);
	color: #2ecc71;
	border-radius: 8px;
	text-align: center;
	font-weight: bold;
}

.quests-section {
	flex: 1;
	overflow-y: auto;
	min-height: 0;

	.loading,
	.no-quests {
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

.quests-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.quest-card {
	padding: 12px;
	background: var(--panel);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;

	&:hover {
		background: var(--panelHighlight);
	}

	&.selected {
		border-color: var(--accent);
	}
}

.quest-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.quest-type {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: bold;
	text-transform: uppercase;

	&.collect {
		background: #3498db;
		color: white;
	}

	&.deliver {
		background: #9b59b6;
		color: white;
	}

	&.find_name {
		background: #e67e22;
		color: white;
	}

	&.find_flavor {
		background: #1abc9c;
		color: white;
	}
}

.quest-difficulty {
	display: flex;
	gap: 2px;

	.star {
		font-size: 12px;

		&.filled {
			color: #f1c40f;
		}

		&.empty {
			color: var(--divider);
		}
	}
}

.quest-description {
	font-size: 14px;
	font-weight: 500;
	margin-bottom: 8px;
	line-height: 1.4;
}

.quest-info {
	display: flex;
	justify-content: space-between;
	font-size: 12px;
	color: var(--fgTransparent);
	margin-bottom: 8px;
}

.quest-rewards {
	display: flex;
	gap: 12px;
	font-size: 13px;

	.reward-coins {
		color: #f1c40f;
		font-weight: bold;
	}

	.reward-item {
		color: #2ecc71;
	}
}

.quest-details {
	margin-top: 12px;
}

.details-divider {
	height: 1px;
	background: var(--divider);
	margin-bottom: 12px;
}

.deliver-hint {
	padding: 8px;
	border-radius: 4px;
	margin-bottom: 12px;
	font-size: 13px;

	.at-destination {
		color: #2ecc71;
		font-weight: bold;
	}

	.not-at-destination {
		color: #e67e22;
	}
}

.matching-items {
	margin-bottom: 12px;

	.items-label {
		display: block;
		font-size: 12px;
		color: var(--fgTransparent);
		margin-bottom: 8px;
	}

	.no-items {
		padding: 12px;
		background: var(--bg);
		border-radius: 4px;
		text-align: center;
		font-size: 12px;
		color: var(--fgTransparent);
	}

	.items-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.item-button {
		padding: 6px 12px;
		background: var(--accentedBg);
		border: 2px solid transparent;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: var(--accent);
			color: white;
		}

		&.selected {
			border-color: var(--accent);
			background: var(--accent);
			color: white;
		}
	}
}

.quest-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.completed-section {
	flex-shrink: 0;
	max-height: 150px;
	overflow-y: auto;
}

.completed-list {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.completed-quest {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	background: var(--panel);
	border-radius: 4px;
	font-size: 12px;
	opacity: 0.7;
}

.quest-type-mini {
	padding: 1px 4px;
	border-radius: 2px;
	font-size: 9px;
	font-weight: bold;
	text-transform: uppercase;

	&.collect { background: #3498db; color: white; }
	&.deliver { background: #9b59b6; color: white; }
	&.find_name { background: #e67e22; color: white; }
	&.find_flavor { background: #1abc9c; color: white; }
}

.quest-desc-mini {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.quest-reward-mini {
	color: #f1c40f;
	font-weight: bold;
}

.actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid var(--divider);
	flex-shrink: 0;
}
</style>
