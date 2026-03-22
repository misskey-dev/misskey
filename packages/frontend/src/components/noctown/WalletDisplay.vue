<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.balance">
		<i class="ti ti-coin" :class="$style.icon"></i>
		<span :class="$style.amount">{{ formattedBalance }}</span>
	</div>

	<button v-if="showDetails" :class="$style.detailsBtn" @click="toggleDetails">
		<i :class="showTransactions ? 'ti ti-chevron-up' : 'ti ti-chevron-down'"></i>
	</button>

	<!-- Transaction history dropdown -->
	<div v-if="showTransactions" :class="$style.transactions">
		<div v-if="isLoading" :class="$style.loading">
			<MkLoading/>
		</div>

		<template v-else-if="transactions.length > 0">
			<div
				v-for="tx in transactions"
				:key="tx.id"
				:class="$style.transaction"
			>
				<div :class="$style.txInfo">
					<span :class="$style.txType">{{ tx.description }}</span>
					<span :class="$style.txTime">{{ formatTime(tx.createdAt) }}</span>
				</div>
				<span :class="[$style.txAmount, tx.amount >= 0 ? $style.positive : $style.negative]">
					{{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
				</span>
			</div>
		</template>

		<div v-else :class="$style.empty">
			<p>取引履歴がありません</p>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

interface Transaction {
	id: string;
	type: string;
	description: string;
	amount: number;
	createdAt: Date;
}

const props = withDefaults(defineProps<{
	balance?: number;
	showDetails?: boolean;
	autoLoad?: boolean;
}>(), {
	balance: 0,
	showDetails: true,
	autoLoad: true,
});

const isLoading = ref(false);
const currentBalance = ref(props.balance);
const transactions = ref<Transaction[]>([]);
const showTransactions = ref(false);

const formattedBalance = computed(() => {
	return currentBalance.value.toLocaleString();
});

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function loadBalance(): Promise<void> {
	try {
		const res = await window.fetch('/api/noctown/wallet/balance', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			const data = await res.json();
			currentBalance.value = data.balance ?? 0;
		}
	} catch (e) {
		console.error('Failed to load balance:', e);
	}
}

async function loadTransactions(): Promise<void> {
	if (transactions.value.length > 0) return; // Already loaded

	isLoading.value = true;

	try {
		const res = await window.fetch('/api/noctown/wallet/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				limit: 10,
			}),
		});

		if (res.ok) {
			const data = await res.json();
			transactions.value = data.transactions ?? [];
		}
	} catch (e) {
		console.error('Failed to load transactions:', e);
	} finally {
		isLoading.value = false;
	}
}

function toggleDetails(): void {
	showTransactions.value = !showTransactions.value;
	if (showTransactions.value && transactions.value.length === 0) {
		loadTransactions();
	}
}

function formatTime(date: Date | string): string {
	const d = new Date(date);
	const now = new Date();
	const diff = now.getTime() - d.getTime();

	if (diff < 60000) {
		return 'たった今';
	} else if (diff < 3600000) {
		return `${Math.floor(diff / 60000)}分前`;
	} else if (diff < 86400000) {
		return `${Math.floor(diff / 3600000)}時間前`;
	} else {
		return d.toLocaleDateString('ja-JP');
	}
}

// Watch for external balance updates
watch(() => props.balance, (newBalance) => {
	currentBalance.value = newBalance;
});

onMounted(() => {
	if (props.autoLoad) {
		loadBalance();
	}
});

// Expose methods for parent
defineExpose({
	refresh: loadBalance,
});
</script>

<style lang="scss" module>
.container {
	position: relative;
}

.balance {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	border-radius: 20px;
	color: white;
	font-weight: 600;
}

.icon {
	font-size: 16px;
}

.amount {
	font-size: 14px;
}

.detailsBtn {
	position: absolute;
	right: 4px;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	padding: 4px;
	cursor: pointer;
	color: white;
	opacity: 0.8;

	&:hover {
		opacity: 1;
	}
}

.transactions {
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	width: 280px;
	max-height: 300px;
	overflow-y: auto;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	z-index: 100;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.transaction {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-bottom: 1px solid var(--MI_THEME-divider);

	&:last-child {
		border-bottom: none;
	}
}

.txInfo {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.txType {
	font-size: 13px;
	font-weight: 500;
}

.txTime {
	font-size: 11px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.txAmount {
	font-weight: 600;
	font-size: 14px;
}

.positive {
	color: #22c55e;
}

.negative {
	color: #ef4444;
}
</style>
