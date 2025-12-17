<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- FR-029: チャットメッセージ履歴表示パネル -->
<!-- サーバーのnoctown_chat_log_recipientテーブルから50ブロック以内で受信したメッセージを取得・表示 -->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-messages"></i>
		<span>Chat History</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else-if="messages.length === 0" :class="$style.empty">
			<i class="ti ti-messages-off"></i>
			<div>
				50 blocks is your chat history. <br/>
				Messages from players far away are not recorded.
			</div>
		</div>
		<div v-else :class="$style.messageList">
			<div
				v-for="msg in messages"
				:key="msg.id"
				:class="[$style.message, { [$style.myMessage]: msg.isMine }]"
			>
				<div :class="$style.messageHeader">
					<img v-if="msg.avatarUrl" :src="msg.avatarUrl" :class="$style.avatar"/>
					<div v-else :class="$style.avatarPlaceholder">
						<i class="ti ti-user"></i>
					</div>
					<div :class="$style.userInfo">
						<span :class="$style.username">{{ msg.name || msg.username }}</span>
						<span :class="$style.time">{{ formatTime(msg.createdAt) }}</span>
					</div>
				</div>
				<div :class="$style.messageContent">
					{{ msg.content }}
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

// FR-029: チャットメッセージ型定義
interface ChatMessage {
	id: string;
	playerId: string;
	username: string;
	name: string | null;
	avatarUrl: string | null;
	content: string;
	positionX: number;
	positionZ: number;
	createdAt: string;
	isMine: boolean;
}

defineEmits<{
	(e: 'close'): void;
}>();

const loading = ref(true);
const messages = ref<ChatMessage[]>([]);

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

// FR-029: サーバーからチャット履歴を取得
// 自分が送信したメッセージ + 50ブロック以内で受信したメッセージを取得
async function fetchChatHistory(): Promise<void> {
	try {
		loading.value = true;

		const token = getToken();
		console.log('[ChatHistory] Fetching chat history, token exists:', !!token);

		const res = await window.fetch('/api/noctown/chat-history', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: token,
				limit: 50,
			}),
		});

		console.log('[ChatHistory] Response status:', res.status);

		if (res.ok) {
			const data = await res.json();
			console.log('[ChatHistory] Received messages:', data.length, data);
			messages.value = data;
		} else {
			const errorText = await res.text();
			console.error('[ChatHistory] API error:', res.status, errorText);
		}
	} catch (e) {
		console.error('[ChatHistory] Failed to fetch chat history:', e);
	} finally {
		loading.value = false;
	}
}

function formatTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);

	if (diffMins < 1) {
		return 'now';
	} else if (diffMins < 60) {
		return `${diffMins}m ago`;
	} else if (diffHours < 24) {
		return `${diffHours}h ago`;
	} else {
		return date.toLocaleDateString();
	}
}

onMounted(() => {
	fetchChatHistory();
});

defineExpose({
	refresh: fetchChatHistory,
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	left: 16px;
	top: 60px;
	width: 340px;
	max-height: 500px;
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

.content {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
	min-height: 150px;
	max-height: 380px;
}

.loading, .empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 120px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	gap: 12px;
	text-align: center;
	font-size: 13px;
	line-height: 1.5;

	i {
		font-size: 32px;
		opacity: 0.5;
	}
}

.messageList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.message {
	padding: 10px 12px;
	border-radius: 8px;
	background: var(--MI_THEME-bg);
}

// 仕様: 自分のメッセージは右寄せで背景色を変える
.myMessage {
	background: color-mix(in srgb, var(--MI_THEME-accent) 15%, var(--MI_THEME-bg));
	border-left: 3px solid var(--MI_THEME-accent);
}

.messageHeader {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 6px;
}

.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
}

.avatarPlaceholder {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--MI_THEME-buttonBg);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.userInfo {
	flex: 1;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.username {
	font-size: 13px;
	font-weight: 500;
	color: var(--MI_THEME-fg);
}

.time {
	font-size: 11px;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
}

.messageContent {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	line-height: 1.4;
	word-break: break-word;
	white-space: pre-wrap;
}
</style>
