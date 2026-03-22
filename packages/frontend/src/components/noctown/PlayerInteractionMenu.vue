<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container" :style="containerStyle">
	<div :class="$style.menu">
		<div :class="$style.header">
			<img
				v-if="player.avatarUrl"
				:src="player.avatarUrl"
				:class="$style.avatar"
			/>
			<div v-else :class="$style.avatarPlaceholder">
				<i class="ti ti-user"></i>
			</div>
			<div :class="$style.info">
				<span :class="$style.username">{{ truncatedUsername }}</span>
				<span :class="[$style.status, player.isOnline ? $style.online : $style.offline]">
					<i class="ti ti-circle-filled"></i>
					{{ player.isOnline ? 'オンライン' : 'オフライン' }}
				</span>
			</div>
			<button :class="$style.closeBtn" @click="$emit('close')">
				<i class="ti ti-x"></i>
			</button>
		</div>

		<div :class="$style.actions">
			<button :class="$style.actionBtn" @click="handleViewProfile">
				<i class="ti ti-user"></i>
				<span>プロフィール</span>
			</button>

			<button
				v-if="player.isOnline"
				:class="$style.actionBtn"
				@click="handleTrade"
			>
				<i class="ti ti-arrows-exchange"></i>
				<span>トレード</span>
			</button>

			<button
				v-if="!player.isOnline"
				:class="$style.actionBtn"
				@click="handleQuest"
			>
				<i class="ti ti-list-check"></i>
				<span>クエスト</span>
			</button>

			<button :class="$style.actionBtn" @click="handleFollow">
				<i class="ti ti-walk"></i>
				<span>追いかける</span>
			</button>

			<button :class="$style.actionBtn" @click="handleWave">
				<i class="ti ti-hand-stop"></i>
				<span>手を振る</span>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PlayerData } from '@/scripts/noctown/engine.js';

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'view-profile', userId: string): void;
	(e: 'trade', playerId: string): void;
	(e: 'quest', playerId: string): void;
	(e: 'follow', playerId: string): void;
	(e: 'wave', playerId: string): void;
}>();

const props = defineProps<{
	player: PlayerData;
	screenX?: number;
	screenY?: number;
}>();

// Truncate username to 8 characters
const truncatedUsername = computed(() => {
	const name = props.player.username;
	if (name.length <= 8) return name;
	return name.substring(0, 7) + '...';
});

// Position menu near clicked location but keep on screen
const containerStyle = computed(() => {
	if (props.screenX === undefined || props.screenY === undefined) {
		return {
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
		};
	}

	// Keep menu on screen
	const menuWidth = 200;
	const menuHeight = 280;
	const padding = 20;

	let x = props.screenX;
	let y = props.screenY;

	// Adjust if too close to edges
	if (x + menuWidth + padding > window.innerWidth) {
		x = window.innerWidth - menuWidth - padding;
	}
	if (x < padding) x = padding;

	if (y + menuHeight + padding > window.innerHeight) {
		y = window.innerHeight - menuHeight - padding;
	}
	if (y < padding) y = padding;

	return {
		top: `${y}px`,
		left: `${x}px`,
	};
});

function handleViewProfile(): void {
	emit('view-profile', props.player.userId);
	emit('close');
}

function handleTrade(): void {
	emit('trade', props.player.id);
}

function handleQuest(): void {
	emit('quest', props.player.id);
}

function handleFollow(): void {
	emit('follow', props.player.id);
	emit('close');
}

function handleWave(): void {
	emit('wave', props.player.id);
	emit('close');
}
</script>

<style lang="scss" module>
.container {
	position: fixed;
	z-index: 200;
}

.menu {
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	min-width: 200px;
	overflow: hidden;
}

.header {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
}

.avatarPlaceholder {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--MI_THEME-divider);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
	font-size: 20px;
}

.info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.username {
	font-weight: bold;
	font-size: 14px;
	color: var(--MI_THEME-fg);
}

.status {
	font-size: 11px;
	display: flex;
	align-items: center;
	gap: 4px;

	i {
		font-size: 8px;
	}
}

.online {
	color: #4ade80;
}

.offline {
	color: #94a3b8;
}

.closeBtn {
	background: none;
	border: none;
	padding: 4px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
	transition: opacity 0.15s;

	&:hover {
		opacity: 1;
	}
}

.actions {
	padding: 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.actionBtn {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	background: none;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	text-align: left;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	i {
		font-size: 18px;
		width: 24px;
		text-align: center;
	}
}
</style>
