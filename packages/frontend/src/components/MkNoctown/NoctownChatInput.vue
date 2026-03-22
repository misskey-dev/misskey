<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.chatContainer">
	<input
		ref="chatInputRef"
		v-model="message"
		type="text"
		:class="$style.chatInput"
		:placeholder="'メッセージを入力...'"
		maxlength="100"
		@keydown="handleKeydown"
		@input="handleInput"
		@compositionstart="composing = true"
		@compositionend="composing = false"
		@focus="emit('focused')"
		@blur="emit('blurred')"
	/>
	<button
		:class="$style.sendBtn"
		@click="sendMessage"
		:disabled="!canSend"
	>
		送信
	</button>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const emit = defineEmits<{
	(ev: 'send', message: string): void;
	(ev: 'focused'): void;
	(ev: 'blurred'): void;
	(ev: 'input', hasText: boolean): void;
}>();

const chatInputRef = ref<HTMLInputElement>();
const message = ref('');
const composing = ref(false);

const canSend = computed(() => message.value.trim().length > 0);

function handleKeydown(event: KeyboardEvent): void {
	// T132: IME handling - don't send on Enter while composing
	if (event.key === 'Enter' && !composing.value) {
		event.preventDefault();
		sendMessage();
	}
}

// FR-019: Emit input event for typing indicator
function handleInput(): void {
	const hasText = message.value.trim().length > 0;
	emit('input', hasText);
}

function sendMessage(): void {
	// T134: Validate non-empty message
	if (!canSend.value) return;

	const trimmed = message.value.trim();
	emit('send', trimmed);
	message.value = '';
}

// Expose method to focus input
defineExpose({
	focus: () => chatInputRef.value?.focus(),
});
</script>

<style lang="scss" module>
// FR-026: Position chat input at the very bottom of screen on mobile (10px from bottom)
// This prevents overlap with joystick (200px) and emotion panel (200px)
.chatContainer {
	position: absolute;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	gap: 8px;
	width: 90%;
	max-width: 400px;
	z-index: 100;

	// FR-007-3: モバイルでチャット入力が画面下部に隠れないよう位置を上げる
	// PWAのセーフエリアとナビゲーションバーを考慮
	/* Mobile: Higher position to avoid PWA safe area and virtual keyboard */
	@media (max-width: 768px) {
		bottom: 20px;
		width: 85%;
		/* PWA safe area support */
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	// 小型モバイル: さらに上に配置して視認性を確保
	/* Small mobile screens: Even higher for better visibility */
	@media (max-width: 480px) {
		bottom: 30px;
		width: 80%;
	}
}

.chatInput {
	flex: 1;
	padding: 12px 15px;
	border: none;
	border-radius: 25px;
	font-size: 16px;
	color: #000;
	background: rgba(255, 255, 255, 0.95);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	outline: none;
}

.chatInput::placeholder {
	color: #666;
}

.chatInput:focus {
	box-shadow: 0 2px 15px rgba(74, 158, 255, 0.4);
}

.sendBtn {
	padding: 12px 20px;
	background: #4a9eff;
	border: none;
	border-radius: 25px;
	color: white;
	font-size: 14px;
	font-weight: bold;
	cursor: pointer;
	white-space: nowrap;
}

.sendBtn:hover {
	background: #3a8eef;
}

.sendBtn:active {
	transform: scale(0.95);
}

.sendBtn:disabled {
	background: #ccc;
	cursor: not-allowed;
}
</style>
