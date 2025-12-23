<script setup lang="ts">
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, onMounted } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

interface Agent {
	id: string;
	itemId: string;
	itemName: string;
	nickname: string | null;
	fullness: number;
	happiness: number;
	level: number;
	experience: number;
	isEquipped: boolean;
	createdAt: string;
}

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
}

const props = defineProps<{
	playerId: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'equipped', agent: Agent | null): void;
	(e: 'hint', hint: { type: string; message: string; direction: string | null; distance: string | null }): void;
}>();

const isLoading = ref(true);
const agents = ref<Agent[]>([]);
const feedItems = ref<InventoryItem[]>([]);
const selectedAgent = ref<Agent | null>(null);
const isFeeding = ref(false);
const isEquipping = ref(false);
const isRequestingHint = ref(false);
const error = ref<string | null>(null);
const feedMessage = ref<string | null>(null);

const equippedAgent = computed(() => agents.value.find(a => a.isEquipped) ?? null);

onMounted(async () => {
	await Promise.all([loadAgents(), loadFeedItems()]);
});

async function loadAgents() {
	isLoading.value = true;
	error.value = null;

	try {
		const result = await misskeyApi('noctown/agent/list', {});
		agents.value = (result as { agents: Agent[] }).agents;
	} catch (err) {
		error.value = 'Failed to load agents';
		console.error('Failed to load agents:', err);
	} finally {
		isLoading.value = false;
	}
}

async function loadFeedItems() {
	try {
		const result = await misskeyApi('noctown/item/inventory', {});
		// 仕様: APIレスポンスが{balance, items}形式なのでitemsを取り出す
		feedItems.value = result.items.filter((item: InventoryItem) => item.itemType === 'feed');
	} catch (err) {
		console.error('Failed to load feed items:', err);
	}
}

async function equipAgent(agent: Agent | null) {
	if (isEquipping.value) return;

	isEquipping.value = true;
	error.value = null;

	try {
		await misskeyApi('noctown/agent/equip', {
			agentId: agent?.id,
		});

		// Update local state
		agents.value.forEach(a => {
			a.isEquipped = a.id === agent?.id;
		});

		emit('equipped', agent);
	} catch (err) {
		error.value = 'Failed to equip agent';
		console.error('Failed to equip agent:', err);
	} finally {
		isEquipping.value = false;
	}
}

async function feedAgent(agent: Agent, feedItem: InventoryItem) {
	if (isFeeding.value) return;

	isFeeding.value = true;
	error.value = null;
	feedMessage.value = null;

	try {
		const result = await misskeyApi('noctown/agent/feed', {
			agentId: agent.id,
			playerItemId: feedItem.id,
		}) as { fullness: number; happiness: number; experienceGained: number };

		// Update agent stats
		agent.fullness = result.fullness;
		agent.happiness = result.happiness;

		feedMessage.value = `Fed! +${result.experienceGained} EXP`;

		// Refresh feed items
		await loadFeedItems();

		setTimeout(() => {
			feedMessage.value = null;
		}, 2000);
	} catch (err: any) {
		if (err.code === 'ALREADY_FULL') {
			error.value = 'Agent is already full!';
		} else if (err.code === 'NO_FEED_ITEM') {
			error.value = 'Feed item not found';
		} else {
			error.value = 'Failed to feed agent';
		}
		console.error('Failed to feed agent:', err);
	} finally {
		isFeeding.value = false;
	}
}

async function requestHint() {
	if (!equippedAgent.value || isRequestingHint.value) return;

	isRequestingHint.value = true;
	error.value = null;

	try {
		const result = await misskeyApi('noctown/agent/hint', {
			agentId: equippedAgent.value.id,
		}) as { hint: { type: string; message: string; direction: string | null; distance: string | null } };

		emit('hint', result.hint);

		// Refresh agent stats (fullness decreased)
		await loadAgents();
	} catch (err: any) {
		if (err.code === 'TOO_HUNGRY') {
			error.value = 'Agent is too hungry to give hints!';
		} else if (err.code === 'COOLDOWN') {
			error.value = 'Agent needs to rest before giving another hint';
		} else {
			error.value = 'Failed to get hint';
		}
		console.error('Failed to get hint:', err);
	} finally {
		isRequestingHint.value = false;
	}
}

function selectAgent(agent: Agent) {
	selectedAgent.value = selectedAgent.value?.id === agent.id ? null : agent;
}

function getStatusColor(value: number): string {
	if (value >= 70) return '#2ecc71';
	if (value >= 40) return '#f1c40f';
	return '#e74c3c';
}

function getExpProgress(agent: Agent): number {
	const expForLevel = agent.level * 100;
	return (agent.experience / expForLevel) * 100;
}

function close() {
	emit('close');
}
</script>

<template>
	<MkModalWindow
		:width="550"
		:height="600"
		@close="close"
		@closed="close"
	>
		<template #header>
			<span class="header-title">My Agents</span>
		</template>

		<div class="agent-panel">
			<!-- Currently Equipped -->
			<section class="equipped-section">
				<h3 class="section-title">Equipped Agent</h3>
				<div v-if="equippedAgent" class="equipped-agent">
					<div class="agent-preview">
						<div class="agent-icon" :style="{ backgroundColor: `hsl(${equippedAgent.itemId.charCodeAt(0) * 5 % 360}, 60%, 70%)` }">
							{{ equippedAgent.nickname?.[0] ?? equippedAgent.itemName[0] }}
						</div>
					</div>
					<div class="agent-info">
						<span class="agent-name">{{ equippedAgent.nickname ?? equippedAgent.itemName }}</span>
						<span class="agent-level">Lv.{{ equippedAgent.level }}</span>
					</div>
					<div class="agent-actions">
						<MkButton small @click="requestHint" :disabled="isRequestingHint">
							{{ isRequestingHint ? '...' : 'Ask Hint' }}
						</MkButton>
						<MkButton small danger @click="equipAgent(null)" :disabled="isEquipping">
							Unequip
						</MkButton>
					</div>
				</div>
				<div v-else class="no-equipped">
					<span>No agent equipped</span>
				</div>
			</section>

			<!-- Agent List -->
			<section class="agents-section">
				<h3 class="section-title">All Agents</h3>

				<div v-if="isLoading" class="loading">
					Loading agents...
				</div>

				<div v-else-if="agents.length === 0" class="no-agents">
					<span>No agents yet</span>
					<p class="hint">Find agent items to get a companion!</p>
				</div>

				<div v-else class="agents-list">
					<div
						v-for="agent in agents"
						:key="agent.id"
						class="agent-card"
						:class="{ selected: selectedAgent?.id === agent.id, equipped: agent.isEquipped }"
						@click="selectAgent(agent)"
					>
						<div class="agent-header">
							<div class="agent-icon" :style="{ backgroundColor: `hsl(${agent.itemId.charCodeAt(0) * 5 % 360}, 60%, 70%)` }">
								{{ agent.nickname?.[0] ?? agent.itemName[0] }}
							</div>
							<div class="agent-title">
								<span class="name">{{ agent.nickname ?? agent.itemName }}</span>
								<span class="level">Lv.{{ agent.level }}</span>
							</div>
							<span v-if="agent.isEquipped" class="equipped-badge">Equipped</span>
						</div>

						<!-- Stats -->
						<div class="agent-stats">
							<div class="stat">
								<span class="stat-label">Fullness</span>
								<div class="stat-bar">
									<div class="stat-fill" :style="{ width: `${agent.fullness}%`, backgroundColor: getStatusColor(agent.fullness) }"></div>
								</div>
								<span class="stat-value">{{ agent.fullness }}%</span>
							</div>
							<div class="stat">
								<span class="stat-label">Happiness</span>
								<div class="stat-bar">
									<div class="stat-fill" :style="{ width: `${agent.happiness}%`, backgroundColor: getStatusColor(agent.happiness) }"></div>
								</div>
								<span class="stat-value">{{ agent.happiness }}%</span>
							</div>
							<div class="stat">
								<span class="stat-label">EXP</span>
								<div class="stat-bar">
									<div class="stat-fill exp" :style="{ width: `${getExpProgress(agent)}%` }"></div>
								</div>
								<span class="stat-value">{{ agent.experience }}/{{ agent.level * 100 }}</span>
							</div>
						</div>

						<!-- Actions (when selected) -->
						<div v-if="selectedAgent?.id === agent.id" class="agent-card-actions">
							<MkButton
								v-if="!agent.isEquipped"
								small
								primary
								:disabled="isEquipping"
								@click.stop="equipAgent(agent)"
							>
								Equip
							</MkButton>

							<!-- Feed options -->
							<div v-if="feedItems.length > 0" class="feed-section">
								<span class="feed-label">Feed:</span>
								<div class="feed-items">
									<button
										v-for="item in feedItems"
										:key="item.id"
										class="feed-item"
										:disabled="isFeeding"
										@click.stop="feedAgent(agent, item)"
									>
										{{ item.itemName }} ({{ item.quantity }})
									</button>
								</div>
							</div>
							<div v-else class="no-feed">
								<span>No feed items</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Messages -->
			<div v-if="error" class="error-message">
				{{ error }}
			</div>
			<div v-if="feedMessage" class="success-message">
				{{ feedMessage }}
			</div>

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
.agent-panel {
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

.equipped-section {
	.equipped-agent {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: var(--accentedBg);
		border-radius: 8px;
	}

	.no-equipped {
		padding: 16px;
		text-align: center;
		color: var(--fgTransparent);
		background: var(--panel);
		border-radius: 8px;
	}
}

.agent-preview {
	flex-shrink: 0;
}

.agent-icon {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	font-weight: bold;
	color: white;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.agent-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.agent-name {
	font-weight: bold;
}

.agent-level {
	font-size: 12px;
	color: var(--accent);
}

.agent-actions {
	display: flex;
	gap: 8px;
}

.agents-section {
	flex: 1;
	overflow-y: auto;
	min-height: 0;

	.loading,
	.no-agents {
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

.agents-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.agent-card {
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

	&.equipped {
		background: var(--accentedBg);
	}
}

.agent-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;

	.agent-icon {
		width: 40px;
		height: 40px;
		font-size: 16px;
	}
}

.agent-title {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;

	.name {
		font-weight: bold;
		font-size: 14px;
	}

	.level {
		font-size: 12px;
		color: var(--accent);
	}
}

.equipped-badge {
	padding: 2px 8px;
	background: var(--accent);
	color: white;
	font-size: 10px;
	border-radius: 4px;
}

.agent-stats {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.stat {
	display: flex;
	align-items: center;
	gap: 8px;

	.stat-label {
		width: 70px;
		font-size: 11px;
		color: var(--fgTransparent);
	}

	.stat-bar {
		flex: 1;
		height: 8px;
		background: var(--divider);
		border-radius: 4px;
		overflow: hidden;
	}

	.stat-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;

		&.exp {
			background: var(--accent);
		}
	}

	.stat-value {
		width: 50px;
		font-size: 11px;
		text-align: right;
		color: var(--fgTransparent);
	}
}

.agent-card-actions {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--divider);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.feed-section {
	display: flex;
	flex-direction: column;
	gap: 4px;

	.feed-label {
		font-size: 12px;
		color: var(--fgTransparent);
	}

	.feed-items {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.feed-item {
		padding: 4px 8px;
		background: var(--accentedBg);
		border: 1px solid var(--divider);
		border-radius: 4px;
		font-size: 11px;
		cursor: pointer;

		&:hover:not(:disabled) {
			background: var(--accent);
			color: white;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
}

.no-feed {
	font-size: 12px;
	color: var(--fgTransparent);
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
}

.actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid var(--divider);
}
</style>
