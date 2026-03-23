<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-trophy"></i>
		<span>ランキング</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div :class="$style.tabs">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			:class="[$style.tab, { [$style.active]: currentTab === tab.id }]"
			@click="switchTab(tab.id)"
		>
			<i :class="tab.icon"></i>
			<span>{{ tab.name }}</span>
		</button>
	</div>

	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else>
			<!-- My rank card -->
			<div v-if="myRank" :class="$style.myRankCard">
				<div :class="$style.myRankLabel">あなたの順位</div>
				<div :class="$style.myRankValue">
					<span :class="$style.rankNumber">#{{ myRank.rank }}</span>
					<span :class="$style.rankScore">{{ formatScore(myRank.score ?? myRank.totalScore) }}</span>
				</div>
			</div>

			<!-- Rankings list -->
			<div :class="$style.rankingList">
				<div
					v-for="entry in rankings"
					:key="entry.playerId"
					:class="[$style.rankEntry, { [$style.isMe]: entry.isMe, [$style.topThree]: entry.rank <= 3 }]"
				>
					<div :class="$style.rankPosition">
						<span v-if="entry.rank === 1" :class="[$style.medal, $style.gold]">
							<i class="ti ti-medal"></i>
						</span>
						<span v-else-if="entry.rank === 2" :class="[$style.medal, $style.silver]">
							<i class="ti ti-medal"></i>
						</span>
						<span v-else-if="entry.rank === 3" :class="[$style.medal, $style.bronze]">
							<i class="ti ti-medal"></i>
						</span>
						<span v-else :class="$style.rankNum">{{ entry.rank }}</span>
					</div>
					<div :class="$style.playerInfo">
						<div :class="$style.avatar">
							<img v-if="entry.avatarUrl" :src="entry.avatarUrl" alt="" />
							<i v-else class="ti ti-user"></i>
						</div>
						<div :class="$style.playerName">{{ entry.username }}</div>
					</div>
					<div :class="$style.score">
						{{ formatScore(entry.score ?? entry.totalScore) }}
					</div>
				</div>
			</div>

			<!-- Load more -->
			<div v-if="hasMore" :class="$style.loadMore">
				<button :class="$style.loadMoreBtn" :disabled="loadingMore" @click="loadMore">
					{{ loadingMore ? '読み込み中...' : 'もっと見る' }}
				</button>
			</div>

			<!-- Total players -->
			<div v-if="totalPlayers" :class="$style.totalPlayers">
				全 {{ totalPlayers }} 人中
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

interface RankEntry {
	rank: number;
	playerId: string;
	username: string;
	avatarUrl: string | null;
	score?: number;
	totalScore?: number;
	isMe: boolean;
}

interface MyRank {
	rank: number;
	score?: number;
	totalScore?: number;
}

const emit = defineEmits<{
	(e: 'close'): void;
}>();

const tabs = [
	{ id: 'total', name: '総合', icon: 'ti ti-trophy' },
	{ id: 'balance', name: '資産', icon: 'ti ti-coin' },
	{ id: 'item', name: 'アイテム', icon: 'ti ti-package' },
	{ id: 'quest', name: 'クエスト', icon: 'ti ti-list-check' },
	{ id: 'quests_completed', name: '達成数', icon: 'ti ti-check' },
];

const currentTab = ref('total');
const loading = ref(false);
const loadingMore = ref(false);
const rankings = ref<RankEntry[]>([]);
const myRank = ref<MyRank | null>(null);
const totalPlayers = ref<number | null>(null);
const offset = ref(0);
const limit = 30;
const hasMore = ref(false);

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

function formatScore(score: number | undefined): string {
	if (score === undefined) return '0';
	if (score >= 1000000) {
		return (score / 1000000).toFixed(1) + 'M';
	} else if (score >= 1000) {
		return (score / 1000).toFixed(1) + 'K';
	}
	return score.toString();
}

async function fetchRankings(append = false): Promise<void> {
	if (!append) {
		loading.value = true;
		offset.value = 0;
		rankings.value = [];
	} else {
		loadingMore.value = true;
	}

	try {
		let endpoint: string;
		let body: Record<string, unknown>;

		if (currentTab.value === 'total') {
			endpoint = '/api/noctown/ranking/total';
			body = {
				i: getToken(),
				limit,
				offset: offset.value,
			};
		} else {
			endpoint = '/api/noctown/ranking/category';
			body = {
				i: getToken(),
				category: currentTab.value,
				limit,
				offset: offset.value,
			};
		}

		const res = await window.fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify(body),
		});

		if (res.ok) {
			const data = await res.json();

			if (append) {
				rankings.value = [...rankings.value, ...data.rankings];
			} else {
				rankings.value = data.rankings ?? [];
				myRank.value = data.myRank;
				totalPlayers.value = data.totalPlayers ?? null;
			}

			hasMore.value = data.rankings.length === limit;
			offset.value += data.rankings.length;
		}
	} catch (e) {
		console.error('Failed to fetch rankings:', e);
	} finally {
		loading.value = false;
		loadingMore.value = false;
	}
}

function switchTab(tabId: string): void {
	if (currentTab.value === tabId) return;
	currentTab.value = tabId;
	fetchRankings();
}

function loadMore(): void {
	fetchRankings(true);
}

onMounted(() => {
	fetchRankings();
});

defineExpose({
	refresh: () => fetchRankings(),
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	right: 16px;
	top: 60px;
	width: 340px;
	max-height: 550px;
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

.tabs {
	display: flex;
	padding: 8px;
	gap: 4px;
	overflow-x: auto;
	border-bottom: 1px solid var(--MI_THEME-divider);

	&::-webkit-scrollbar {
		height: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: var(--MI_THEME-divider);
		border-radius: 2px;
	}
}

.tab {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 6px 10px;
	background: none;
	border: none;
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: white;
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 12px;
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 150px;
}

.myRankCard {
	background: linear-gradient(135deg, var(--MI_THEME-accent), #9c27b0);
	border-radius: 10px;
	padding: 16px;
	margin-bottom: 16px;
	color: white;
}

.myRankLabel {
	font-size: 12px;
	opacity: 0.9;
	margin-bottom: 6px;
}

.myRankValue {
	display: flex;
	align-items: baseline;
	gap: 12px;
}

.rankNumber {
	font-size: 28px;
	font-weight: 700;
}

.rankScore {
	font-size: 14px;
	opacity: 0.9;
}

.rankingList {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.rankEntry {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	transition: transform 0.15s;

	&:hover {
		transform: translateX(2px);
	}

	&.isMe {
		background: var(--MI_THEME-accentedBg);
		border: 1px solid var(--MI_THEME-accent);
	}

	&.topThree {
		background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
	}
}

.rankPosition {
	width: 32px;
	text-align: center;
}

.medal {
	font-size: 20px;

	&.gold {
		color: #ffd700;
	}

	&.silver {
		color: #c0c0c0;
	}

	&.bronze {
		color: #cd7f32;
	}
}

.rankNum {
	font-size: 14px;
	font-weight: 500;
	opacity: 0.7;
}

.playerInfo {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	i {
		font-size: 16px;
		opacity: 0.5;
	}
}

.playerName {
	font-size: 13px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.score {
	font-size: 14px;
	font-weight: 600;
	color: var(--MI_THEME-accent);
}

.loadMore {
	text-align: center;
	margin-top: 12px;
}

.loadMoreBtn {
	padding: 8px 24px;
	background: var(--MI_THEME-buttonBg);
	border: none;
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 13px;
	cursor: pointer;
	transition: background 0.15s;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.totalPlayers {
	text-align: center;
	margin-top: 12px;
	font-size: 12px;
	opacity: 0.6;
}
</style>
