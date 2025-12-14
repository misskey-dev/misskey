<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.overlay" @click.self="handleClose" @keydown.escape="handleClose" tabindex="-1" ref="overlayRef">
	<div :class="$style.window">
		<button :class="$style.closeButton" @click="handleClose">
			<i class="ti ti-x"></i>
		</button>

		<div :class="$style.content">
			<!-- Avatar -->
			<div :class="$style.avatarWrapper">
				<img :src="avatarUrl || defaultAvatar" :class="$style.avatar" alt="avatar" />
			</div>

			<!-- Name (shown if not empty) -->
			<div v-if="name" :class="$style.name">{{ name }}</div>

			<!-- Username (always shown) -->
			<!-- nameが空の場合は通常サイズ、nameがある場合は小さめフォント -->
			<div :class="name ? $style.username : $style.usernameOnly">@{{ username }}</div>

			<!-- Ping info -->
			<div :class="$style.pingInfo">
				<span :class="$style.pingLabel">Ping:</span>
				<span :class="[$style.pingValue, pingColorClass]">
					{{ pingTime !== null ? `${pingTime}ms` : 'Measuring...' }}
				</span>
			</div>

			<!-- Manual ping button -->
			<button :class="$style.pingButton" @click="handlePing" :disabled="isPinging">
				<i v-if="isPinging" class="ti ti-loader-2" :class="$style.spinner"></i>
				<i v-else class="ti ti-radar-2"></i>
				<span>Ping</span>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
	playerId: string;
	name: string | null;
	username: string;
	avatarUrl: string | null;
	pingTime: number | null;
	isPinging: boolean;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'ping'): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);

const defaultAvatar = computed(() => {
	const host = location.host;
	return `https://${host}/identicon/${props.username}@${host}`;
});

const pingColorClass = computed(() => {
	if (props.pingTime === null) return '';
	if (props.pingTime < 100) return 'pingGood';
	if (props.pingTime < 300) return 'pingMedium';
	return 'pingBad';
});

function handleClose() {
	emit('close');
}

function handlePing() {
	emit('ping');
}

onMounted(() => {
	overlayRef.value?.focus();
});
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	outline: none;
}

.window {
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	padding: 24px;
	min-width: 280px;
	max-width: 90vw;
	position: relative;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.closeButton {
	position: absolute;
	top: 8px;
	right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	border-radius: 50%;
	transition: background 0.15s, opacity 0.15s;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}

.avatarWrapper {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	overflow: hidden;
	background: var(--MI_THEME-bg);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.name {
	font-size: 18px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.username {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.usernameOnly {
	font-size: 18px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.pingInfo {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 8px;
}

.pingLabel {
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.pingValue {
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.pingValue:global(.pingGood) {
	color: #00ff00;
}

.pingValue:global(.pingMedium) {
	color: #ffff00;
}

.pingValue:global(.pingBad) {
	color: #ff4444;
}

.pingButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: var(--MI_THEME-accent);
	color: #fff;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	margin-top: 8px;
	transition: opacity 0.15s;

	&:hover:not(:disabled) {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.spinner {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
