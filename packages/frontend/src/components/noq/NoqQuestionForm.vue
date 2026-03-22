<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<script setup lang="ts">
/**
 * NoqQuestionForm.vue
 * 質問送信フォームコンポーネント
 * - テキスト入力（文字数カウント）
 * - username開示オプション
 * - 回答不要オプション
 * - メッセージカードデザイン選択
 * - E2E暗号化オプション（両者が公開鍵を持っている場合のみ）
 */
import { ref, computed, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { encrypt as encryptE2E, isValidPublicKey } from '@/utility/noq-crypto.js';
import MkButton from '@/components/MkButton.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInfo from '@/components/MkInfo.vue';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
	requireUsernameDisclosure: boolean;
	notice: string | null;
	recipientE2EPublicKey?: string | null;
	myE2EPublicKey?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'sent'): void;
}>();

const MAX_TEXT_LENGTH = 3000;

// カードデザインの型定義
type CardDesignType = 'default' | 'blue_sky' | 'love' | 'nocturne' | 'romantic' | 'sakura' | 'night_sky' | 'pastel';

const text = ref('');
const isUsernameDisclosed = ref(props.requireUsernameDisclosure);
const isNoReplyRequested = ref(false);
const cardDesign = ref<CardDesignType>('default');
const isE2EEncrypted = ref(false);
const sending = ref(false);

// E2E暗号化が利用可能かどうか（両者が公開鍵を持っている場合のみ）
const canUseE2E = computed(() => {
	return !!(
		props.recipientE2EPublicKey &&
		isValidPublicKey(props.recipientE2EPublicKey) &&
		props.myE2EPublicKey &&
		isValidPublicKey(props.myE2EPublicKey)
	);
});

// カードデザイン選択肢（MkSelect items形式）
const cardDesignItems: { value: CardDesignType; label: string }[] = [
	{ value: 'default', label: String(i18n.ts._noq.cardDesigns.default) },
	{ value: 'blue_sky', label: String(i18n.ts._noq.cardDesigns.blueSky) },
	{ value: 'love', label: String(i18n.ts._noq.cardDesigns.love) },
	{ value: 'nocturne', label: String(i18n.ts._noq.cardDesigns.nocturne) },
	{ value: 'romantic', label: String(i18n.ts._noq.cardDesigns.romantic) },
	{ value: 'sakura', label: String(i18n.ts._noq.cardDesigns.sakura) },
	{ value: 'night_sky', label: String(i18n.ts._noq.cardDesigns.nightSky) },
	{ value: 'pastel', label: String(i18n.ts._noq.cardDesigns.pastel) },
];

const textLength = computed(() => text.value.length);
const canSend = computed(() => text.value.trim().length > 0 && text.value.length <= MAX_TEXT_LENGTH && !sending.value);

// 絵文字ピッカーボタン参照
const emojiButtonRef = ref<HTMLButtonElement>();

// 絵文字ピッカー初期化
onMounted(() => {
	emojiPicker.init();
});

// 絵文字ピッカーを表示
function showEmojiPicker(ev: MouseEvent) {
	if (!emojiButtonRef.value) return;
	emojiPicker.show(
		emojiButtonRef.value,
		(emoji: string) => {
			text.value += emoji;
		},
	);
}

async function send() {
	if (!canSend.value) return;

	sending.value = true;
	try {
		let questionText = text.value;
		let encrypted = false;

		// E2E暗号化が有効で、利用可能な場合は暗号化
		if (isE2EEncrypted.value && canUseE2E.value && props.recipientE2EPublicKey) {
			questionText = await encryptE2E(text.value, props.recipientE2EPublicKey);
			encrypted = true;
		}

		await misskeyApi('noq/questions/send', {
			recipientId: props.user.id,
			text: questionText,
			isUsernameDisclosed: isUsernameDisclosed.value,
			isNoReplyRequested: isNoReplyRequested.value,
			cardDesign: encrypted ? 'default' : cardDesign.value, // 暗号化時はカードデザイン無効
			isE2EEncrypted: encrypted,
		});

		text.value = '';
		emit('sent');
	} catch (err: unknown) {
		console.error(err);
	} finally {
		sending.value = false;
	}
}
</script>

<template>
<div class="noq-question-form">
	<MkInfo v-if="notice" class="notice">{{ notice }}</MkInfo>

	<MkTextarea
		v-model="text"
		:placeholder="i18n.ts._noq.questionTextPlaceholder"
		:max="MAX_TEXT_LENGTH"
		:mfmAutocomplete="true"
		class="textarea"
	/>

	<div class="toolbar">
		<button ref="emojiButtonRef" class="emoji-button" type="button" @click="showEmojiPicker">
			<i class="ti ti-mood-smile"></i>
		</button>
		<div class="char-count" :class="{ over: textLength > MAX_TEXT_LENGTH }">
			{{ textLength }} / {{ MAX_TEXT_LENGTH }}
		</div>
	</div>

	<div class="options">
		<MkSwitch v-model="isUsernameDisclosed" :disabled="requireUsernameDisclosure">
			{{ i18n.ts._noq.discloseUsername }}
		</MkSwitch>

		<MkSwitch v-model="isNoReplyRequested">
			{{ i18n.ts._noq.noReplyRequested }}
		</MkSwitch>

		<!-- E2E暗号化オプション（両者が公開鍵を持っている場合のみ表示） -->
		<MkSwitch v-if="canUseE2E" v-model="isE2EEncrypted">
			<i class="ti ti-lock"></i>
			{{ i18n.ts._noq?.e2eEncryption ?? 'E2E暗号化' }}
		</MkSwitch>

		<!-- 暗号化モードでは画像添付・カード選択を無効化 -->
		<MkSelect v-model="cardDesign" :items="cardDesignItems" class="card-design" :disabled="isE2EEncrypted">
			<template #label>{{ i18n.ts._noq.cardDesign }}</template>
		</MkSelect>

		<!-- E2E暗号化時の注意事項 -->
		<MkInfo v-if="isE2EEncrypted" class="e2e-info">
			{{ i18n.ts._noq?.e2eEncryptionNote ?? '暗号化された質問は復号ツールでのみ読むことができます。画像添付・カードデザインは使用できません。' }}
		</MkInfo>
	</div>

	<MkButton :disabled="!canSend" primary class="send-button" @click="send">
		{{ i18n.ts._noq.sendQuestion }}
	</MkButton>
</div>
</template>

<style scoped lang="scss">
.noq-question-form {
	padding: 16px;

	.notice {
		margin-bottom: 16px;
	}

	.textarea {
		margin-bottom: 8px;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;

		.emoji-button {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border: none;
			border-radius: 4px;
			background: var(--buttonBg);
			color: var(--fg);
			cursor: pointer;
			font-size: 16px;

			&:hover {
				background: var(--buttonHoverBg);
			}
		}

		.char-count {
			text-align: right;
			font-size: 0.9em;
			color: var(--fgTransparent);

			&.over {
				color: var(--error);
			}
		}
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;

		.card-design {
			margin-top: 8px;
		}
	}

	.send-button {
		width: 100%;
	}
}
</style>
