<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 仕様: T012, T013 受信者向け「承認確認」トーストコンポーネント -->
<template>
<div :class="$style.toast" @click.stop>
	<div :class="$style.content">
		<div :class="$style.icon">
			<i class="ti ti-arrows-exchange"></i>
		</div>
		<div :class="$style.info">
			<div :class="$style.title">トレードリクエスト</div>
			<div :class="$style.message">
				<span :class="$style.username">{{ initiatorUsername }}</span> からトレードリクエストが届きました
			</div>
			<div :class="$style.offerSummary">
				<span v-if="itemCount > 0">{{ itemCount }}個のアイテム</span>
				<span v-if="itemCount > 0 && currency > 0"> + </span>
				<span v-if="currency > 0">{{ currency }}G</span>
			</div>
			<div v-if="tradeMessage" :class="$style.tradeMessage">
				<i class="ti ti-message"></i>
				{{ tradeMessage }}
			</div>
			<div :class="$style.timer">
				残り {{ remainingTime }}
			</div>
		</div>
	</div>
	<!-- T013: 承認/拒否ボタン -->
	<div :class="$style.actions">
		<button :class="$style.acceptBtn" :disabled="isResponding" @click="handleAccept">
			<template v-if="isResponding && respondType === 'accept'">
				<MkLoading :em="true"/>
			</template>
			<template v-else>
				<i class="ti ti-check"></i>
				承認
			</template>
		</button>
		<button :class="$style.declineBtn" :disabled="isResponding" @click="handleDecline">
			<template v-if="isResponding && respondType === 'decline'">
				<MkLoading :em="true"/>
			</template>
			<template v-else>
				<i class="ti ti-x"></i>
				拒否
			</template>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

const props = defineProps<{
	tradeId: string;
	initiatorId: string;
	initiatorUsername: string;
	itemCount: number;
	currency: number;
	tradeMessage: string | null;
	expiresAt: string;
}>();

const emit = defineEmits<{
	(e: 'accept', tradeId: string): void;
	(e: 'decline', tradeId: string): void;
	(e: 'expired'): void;
}>();

const isResponding = ref(false);
const respondType = ref<'accept' | 'decline' | null>(null);
const now = ref(Date.now());
let timerInterval: number | null = null;

const remainingTime = computed(() => {
	const expiresAtMs = new Date(props.expiresAt).getTime();
	const diff = Math.max(0, expiresAtMs - now.value);
	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const isExpired = computed(() => {
	return new Date(props.expiresAt).getTime() <= now.value;
});

function handleAccept(): void {
	if (isResponding.value) return;
	isResponding.value = true;
	respondType.value = 'accept';
	emit('accept', props.tradeId);
}

function handleDecline(): void {
	if (isResponding.value) return;
	isResponding.value = true;
	respondType.value = 'decline';
	emit('decline', props.tradeId);
}

onMounted(() => {
	timerInterval = window.setInterval(() => {
		now.value = Date.now();
		if (isExpired.value) {
			emit('expired');
		}
	}, 1000);
});

onUnmounted(() => {
	if (timerInterval) {
		window.clearInterval(timerInterval);
	}
});
</script>

<style lang="scss" module>
.toast {
	position: fixed;
	top: 80px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 10000;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	padding: 16px;
	min-width: 300px;
	max-width: 400px;
	animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateX(-50%) translateY(-20px);
	}
	to {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
}

.content {
	display: flex;
	gap: 12px;
	margin-bottom: 12px;
}

.icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(59, 130, 246, 0.2);
	border-radius: 50%;
	color: #3b82f6;
	font-size: 20px;
}

.info {
	flex: 1;
}

.title {
	font-weight: 600;
	font-size: 14px;
	margin-bottom: 4px;
}

.message {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
}

.username {
	font-weight: 600;
	color: var(--MI_THEME-accent);
}

.offerSummary {
	margin-top: 6px;
	font-size: 13px;
	color: #f59e0b;
	font-weight: 500;
}

.tradeMessage {
	margin-top: 8px;
	padding: 8px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	display: flex;
	align-items: flex-start;
	gap: 6px;

	i {
		opacity: 0.6;
	}
}

.timer {
	margin-top: 6px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.actions {
	display: flex;
	gap: 8px;
}

.acceptBtn, .declineBtn {
	flex: 1;
	padding: 10px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	transition: all 0.15s;
	min-height: 44px; // タッチターゲット

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.acceptBtn {
	background: #22c55e;
	color: white;

	&:hover:not(:disabled) {
		background: #16a34a;
	}
}

.declineBtn {
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	color: var(--MI_THEME-fg);

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}
}
</style>
