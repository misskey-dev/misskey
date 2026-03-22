<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 仕様: T010, T011 送信者向け「承認待ち」トーストコンポーネント -->
<template>
<div :class="$style.toast" @click.stop>
	<div :class="$style.content">
		<div :class="$style.icon">
			<i class="ti ti-clock"></i>
		</div>
		<div :class="$style.info">
			<div :class="$style.title">トレードリクエスト送信済み</div>
			<div :class="$style.message">
				<span :class="$style.username">{{ targetUsername }}</span> の承認を待っています...
			</div>
			<div :class="$style.timer">
				残り {{ remainingTime }}
			</div>
		</div>
	</div>
	<!-- T011: キャンセルボタン -->
	<button :class="$style.cancelBtn" @click="handleCancel" :disabled="isCancelling">
		<template v-if="isCancelling">
			<MkLoading :em="true"/>
		</template>
		<template v-else>
			キャンセル
		</template>
	</button>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

const props = defineProps<{
	tradeId: string;
	targetUsername: string;
	expiresAt: string;
}>();

const emit = defineEmits<{
	(e: 'cancel', tradeId: string): void;
	(e: 'expired'): void;
}>();

const isCancelling = ref(false);
const now = ref(Date.now());
let timerInterval: ReturnType<typeof setInterval> | null = null;

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

function handleCancel(): void {
	if (isCancelling.value) return;
	isCancelling.value = true;
	emit('cancel', props.tradeId);
}

onMounted(() => {
	timerInterval = setInterval(() => {
		now.value = Date.now();
		if (isExpired.value) {
			emit('expired');
		}
	}, 1000);
});

onUnmounted(() => {
	if (timerInterval) {
		clearInterval(timerInterval);
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
	min-width: 280px;
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
	background: rgba(251, 191, 36, 0.2);
	border-radius: 50%;
	color: #f59e0b;
	font-size: 20px;
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.6;
	}
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

.timer {
	margin-top: 6px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.cancelBtn {
	width: 100%;
	padding: 10px;
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 13px;
	transition: all 0.15s;
	min-height: 44px; // タッチターゲット

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
