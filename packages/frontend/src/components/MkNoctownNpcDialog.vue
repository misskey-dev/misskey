<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.overlay" @click.self="$emit('close')">
	<div :class="$style.dialog">
		<div :class="$style.header">
			<div :class="$style.npcInfo">
				<div :class="$style.avatar">
					<img v-if="npc.avatarUrl" :src="npc.avatarUrl" :class="$style.avatarImg"/>
					<i v-else class="ti ti-user" :class="$style.avatarPlaceholder"></i>
				</div>
				<div :class="$style.npcName">{{ npc.username }}</div>
			</div>
			<button :class="$style.closeBtn" @click="$emit('close')">
				<i class="ti ti-x"></i>
			</button>
		</div>
		<div :class="$style.content">
			<p :class="$style.greeting">
				やあ、旅人さん！何かお手伝いできることはあるかい？
			</p>
		</div>
		<div :class="$style.actions">
			<MkButton :class="$style.actionBtn" primary @click="startQuest">
				<i class="ti ti-list-check"></i> クエストを受ける
			</MkButton>
			<MkButton :class="$style.actionBtn" @click="$emit('close')">
				<i class="ti ti-door-exit"></i> 立ち去る
			</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';

interface NpcData {
	id: string;
	playerId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
}

const props = defineProps<{
	npc: NpcData;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'questStarted', questId: string): void;
}>();

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function startQuest(): Promise<void> {
	try {
		const res = await window.fetch('/api/noctown/quest/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				npcId: props.npc.id,
			}),
		});

		if (res.ok) {
			const result = await res.json();
			emit('questStarted', result.questId);
			emit('close');
		} else {
			const error = await res.json();
			console.error('Failed to start quest:', error);
		}
	} catch (e) {
		console.error('Failed to start quest:', e);
	}
}
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 150;
}

.dialog {
	width: 320px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	overflow: hidden;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	background: var(--MI_THEME-bg);
}

.npcInfo {
	display: flex;
	align-items: center;
	gap: 12px;
}

.avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatarImg {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.avatarPlaceholder {
	font-size: 24px;
	opacity: 0.5;
}

.npcName {
	font-size: 16px;
	font-weight: bold;
}

.closeBtn {
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	padding: 8px;
	border-radius: 50%;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	padding: 20px;
}

.greeting {
	font-size: 14px;
	line-height: 1.6;
	margin: 0;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.actionBtn {
	width: 100%;
}
</style>
