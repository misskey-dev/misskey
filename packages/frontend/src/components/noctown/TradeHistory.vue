<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- T039: トレード履歴表示コンポーネント -->
<template>
<div :class="$style.container" @click.stop @touchstart.stop @touchend.stop>
	<div :class="$style.header">
		<h2 :class="$style.title">
			<i class="ti ti-history"></i>
			トレード履歴
		</h2>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div :class="$style.content">
		<div v-if="isLoading" :class="$style.loading">
			<MkLoading/>
		</div>

		<div v-else-if="trades.length === 0" :class="$style.empty">
			<i class="ti ti-file-off"></i>
			<p>トレード履歴がありません</p>
		</div>

		<div v-else :class="$style.list">
			<div
				v-for="trade in trades"
				:key="trade.id"
				:class="$style.tradeItem"
			>
				<div :class="$style.tradeHeader">
					<div :class="$style.playerInfo">
						<i :class="[trade.isInitiator ? 'ti ti-arrow-right' : 'ti ti-arrow-left', $style.directionIcon]"></i>
						<span :class="$style.playerName">{{ trade.otherPlayerName }}</span>
					</div>
					<span :class="[$style.status, $style[trade.status]]">
						{{ getStatusLabel(trade.status) }}
					</span>
				</div>
				<div :class="$style.tradeDetails">
					<div :class="$style.detailItem">
						<i class="ti ti-package"></i>
						<span>{{ trade.itemCount }}個のアイテム</span>
					</div>
					<div v-if="trade.currencyOffered > 0" :class="$style.detailItem">
						<i class="ti ti-coin"></i>
						<span>提供: {{ trade.currencyOffered }}G</span>
					</div>
					<div v-if="trade.currencyRequested > 0" :class="$style.detailItem">
						<i class="ti ti-coin"></i>
						<span>受取: {{ trade.currencyRequested }}G</span>
					</div>
				</div>
				<div :class="$style.tradeDate">
					{{ formatDate(trade.createdAt) }}
				</div>
			</div>

			<div v-if="hasMore" :class="$style.loadMore">
				<button :class="$style.loadMoreBtn" :disabled="isLoadingMore" @click="loadMore">
					<template v-if="isLoadingMore">
						<MkLoading :em="true"/>
					</template>
					<template v-else>
						もっと見る
					</template>
				</button>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkLoading from '@/components/global/MkLoading.vue';

const emit = defineEmits<{
	(e: 'close'): void;
}>();

interface TradeItem {
	id: string;
	otherPlayerName: string;
	otherPlayerId: string;
	isInitiator: boolean;
	status: string;
	itemCount: number;
	currencyOffered: number;
	currencyRequested: number;
	message: string | null;
	createdAt: string;
	expiresAt: string;
}

const trades = ref<TradeItem[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const hasMore = ref(false);
const offset = ref(0);
const limit = 20;

function getStatusLabel(status: string): string {
	switch (status) {
		case 'completed': return '完了';
		case 'cancelled': return 'キャンセル';
		case 'expired': return '期限切れ';
		case 'failed': return '失敗';
		default: return status;
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return '今日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
	} else if (days === 1) {
		return '昨日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
	} else if (days < 7) {
		return `${days}日前`;
	} else {
		return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
	}
}

async function fetchHistory(): Promise<void> {
	try {
		// 仕様: noctown/trade/historyエンドポイントを呼び出し
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await misskeyApi('noctown/trade/history' as any, {
			limit,
			offset: offset.value,
		}) as { trades: TradeItem[]; hasMore: boolean };
		trades.value = [...trades.value, ...result.trades];
		hasMore.value = result.hasMore;
		offset.value += result.trades.length;
	} catch (err) {
		console.error('Failed to fetch trade history:', err);
	}
}

async function loadMore(): Promise<void> {
	isLoadingMore.value = true;
	await fetchHistory();
	isLoadingMore.value = false;
}

onMounted(async () => {
	await fetchHistory();
	isLoading.value = false;
});
</script>

<style lang="scss" module>
.container {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 10000;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	width: 90%;
	max-width: 450px;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
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
	font-size: 16px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
}

.closeBtn {
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	border-radius: 8px;
	min-width: 44px;
	min-height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 12px;
}

.loading {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	i {
		font-size: 48px;
		margin-bottom: 12px;
	}

	p {
		margin: 0;
		font-size: 14px;
	}
}

.list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.tradeItem {
	background: var(--MI_THEME-bg);
	border-radius: 12px;
	padding: 12px;
	border: 1px solid var(--MI_THEME-divider);
}

.tradeHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.playerInfo {
	display: flex;
	align-items: center;
	gap: 8px;
}

.directionIcon {
	font-size: 14px;
	opacity: 0.6;
}

.playerName {
	font-weight: 600;
	font-size: 14px;
}

.status {
	font-size: 12px;
	padding: 4px 8px;
	border-radius: 6px;
	font-weight: 500;

	&.completed {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	&.cancelled {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	&.expired {
		background: rgba(156, 163, 175, 0.2);
		color: #9ca3af;
	}

	&.failed {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}
}

.tradeDetails {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 8px;
}

.detailItem {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;

	i {
		opacity: 0.6;
	}
}

.tradeDate {
	font-size: 11px;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
}

.loadMore {
	display: flex;
	justify-content: center;
	padding: 12px;
}

.loadMoreBtn {
	background: var(--MI_THEME-buttonBg);
	border: none;
	border-radius: 8px;
	padding: 10px 20px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 13px;
	min-height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
