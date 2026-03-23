<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<script setup lang="ts">
/**
 * NoqAnswerForm.vue
 * 質問に対する回答フォームコンポーネント
 * - 回答テキスト入力
 * - 公開範囲選択（LocalStorageで記憶）
 * - メッセージカード画像オプション
 * - 回答投稿後に質問ステータス更新
 * - E2E暗号化質問への回答対応（DMで暗号化回答を送信）
 */
import { ref, computed, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { uploadFile } from '@/utility/drive.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { encrypt as encryptE2E, isValidPublicKey, generatePublicKey } from '@/utility/noq-crypto.js';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import NoqMessageCard from './NoqMessageCard.vue';
import type { NoqQuestion } from './NoqQuestionCard.vue';

const props = defineProps<{
	question: NoqQuestion;
	senderE2EPublicKey?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'answered', noteId: string): void;
	(ev: 'cancel'): void;
}>();

// 回答テキスト
const answerText = ref('');

// 公開範囲（LocalStorageから復元）
type Visibility = 'public' | 'home' | 'followers';
const visibility = ref<Visibility>((localStorage.getItem('noq_answer_visibility') as Visibility) ?? 'public');

// 公開範囲オプション
const visibilityItems: MkSelectItem<Visibility>[] = [
	{ value: 'public', label: i18n.ts._visibility.public },
	{ value: 'home', label: i18n.ts._visibility.home },
	{ value: 'followers', label: i18n.ts._visibility.followers },
];

// メッセージカード添付オプション
const includeCard = ref(false);

// メッセージカードコンポーネント参照
const messageCardRef = ref<InstanceType<typeof NoqMessageCard>>();

// 送信中フラグ
const posting = ref(false);

// E2E暗号化質問かどうか
const isE2EQuestion = computed(() => props.question.isE2EEncrypted);

// E2E暗号化回答が可能かどうか（質問者の公開鍵が必要）
const canE2EAnswer = computed(() => {
	return isE2EQuestion.value &&
		props.senderE2EPublicKey &&
		isValidPublicKey(props.senderE2EPublicKey);
});

// 絵文字ピッカーボタン参照
const emojiButtonRef = ref<HTMLButtonElement>();

// 絵文字ピッカーを表示
function showEmojiPicker(ev: MouseEvent) {
	if (!emojiButtonRef.value) return;
	emojiPicker.show(
		emojiButtonRef.value,
		(emoji: string) => {
			answerText.value += emoji;
		},
	);
}

// 回答テキストをそのまま使用（引用は含めない）
const pureAnswerText = computed(() => {
	return answerText.value.trim();
});

// CWテキスト（質問内容）
const cwText = computed(() => {
	const senderInfo = props.question.sender ? '' : '（匿名）';
	return `Q. ${props.question.text}${senderInfo}`;
});

// 本文（回答 + 質問箱URL）
const noteText = computed(() => {
	const questionBoxUrl = `https://noc.ski/@${$i?.username}/noq`;
	return `A. ${answerText.value}\n\n${questionBoxUrl}`;
});

onMounted(() => {
	// 回答テキストは空で開始
	answerText.value = '';
	// 絵文字ピッカーを初期化
	emojiPicker.init();
});

/**
 * Canvas dataURLをBlobに変換
 */
function dataURLtoBlob(dataUrl: string): Blob {
	const parts = dataUrl.split(',');
	const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png';
	const bstr = atob(parts[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], { type: mime });
}

async function postAnswer() {
	if (posting.value) return;
	if (!answerText.value.trim()) return;

	posting.value = true;

	try {
		// 公開範囲をLocalStorageに保存
		localStorage.setItem('noq_answer_visibility', visibility.value);

		// E2E暗号化質問への回答の場合
		if (isE2EQuestion.value && canE2EAnswer.value && props.senderE2EPublicKey) {
			// 回答を暗号化
			const encryptedAnswer = await encryptE2E(pureAnswerText.value, props.senderE2EPublicKey);

			// 質問ステータスを回答済みに更新（暗号化回答を保存）
			await misskeyApi('noq/questions/answer', {
				questionId: props.question.id,
				encryptedAnswer,
			});

			emit('answered', '');
			return;
		}

		// 通常の回答処理
		let fileIds: string[] | undefined;

		// メッセージカードを添付する場合
		if (includeCard.value && messageCardRef.value) {
			const dataUrl = await messageCardRef.value.generateCard();
			const blob = dataURLtoBlob(dataUrl);

			// ドライブにアップロード
			const { filePromise } = uploadFile(blob, {
				name: `noq-card-${props.question.id}.png`,
			});

			const uploadedFile = await filePromise;
			fileIds = [uploadedFile.id];
		}

		// ノートを投稿（質問をCWに、回答を本文に）
		const note = await misskeyApi('notes/create', {
			text: noteText.value,
			cw: cwText.value,
			visibility: visibility.value,
			fileIds,
		});

		// 質問ステータスを回答済みに更新
		await misskeyApi('noq/questions/answer', {
			questionId: props.question.id,
			noteId: note.createdNote.id,
		});

		emit('answered', note.createdNote.id);
	} catch (err) {
		console.error('[NoqAnswerForm] Failed to post answer:', err);
	} finally {
		posting.value = false;
	}
}

function cancel() {
	emit('cancel');
}
</script>

<template>
<div class="noq-answer-form">
	<!-- E2E暗号化質問の場合の注意 -->
	<MkInfo v-if="isE2EQuestion" class="e2e-notice">
		<i class="ti ti-lock"></i>
		{{ i18n.ts._noq?.e2eAnswerNote ?? 'これは暗号化された質問です。回答は質問者にのみDMで送信されます。' }}
	</MkInfo>

	<!-- 質問内容プレビュー -->
	<div class="question-preview">
		<div class="label">{{ i18n.ts._noq.questionText }}</div>
		<div v-if="isE2EQuestion" class="encrypted-text">
			<i class="ti ti-lock"></i>
			{{ i18n.ts._noq?.encryptedQuestion ?? '暗号化された質問' }}
		</div>
		<div v-else class="text">{{ question.text }}</div>
	</div>

	<!-- 回答入力 -->
	<MkTextarea
		v-model="answerText"
		:placeholder="i18n.ts._noq.answerPlaceholder ?? '回答を入力...'"
		class="answer-textarea"
	/>

	<!-- ツールバー（絵文字ボタン） -->
	<div class="toolbar">
		<button ref="emojiButtonRef" class="emoji-button" type="button" @click="showEmojiPicker">
			<i class="ti ti-mood-smile"></i>
		</button>
	</div>

	<!-- 公開範囲選択 -->
	<div class="visibility-row">
		<MkSelect v-model="visibility" :items="visibilityItems" class="visibility-select">
			<template #label>{{ i18n.ts.visibility }}</template>
		</MkSelect>
	</div>

	<!-- メッセージカードオプション（E2E暗号化質問では無効） -->
	<div v-if="!isE2EQuestion" class="card-option">
		<MkSwitch v-model="includeCard">
			<template #label>
				<i class="ti ti-photo"></i>
				{{ i18n.ts._noq.includeMessageCard ?? 'メッセージカードを添付' }}
			</template>
		</MkSwitch>

		<div v-if="includeCard" class="card-preview-container">
			<NoqMessageCard
				ref="messageCardRef"
				:question="question"
				:answerText="pureAnswerText"
			/>
		</div>
	</div>

	<!-- アクションボタン -->
	<div class="actions">
		<MkButton @click="cancel">
			{{ i18n.ts.cancel }}
		</MkButton>
		<MkButton primary :disabled="posting || !answerText.trim()" @click="postAnswer">
			{{ posting ? i18n.ts.sending : i18n.ts._noq.answer }}
		</MkButton>
	</div>
</div>
</template>

<style scoped lang="scss">
.noq-answer-form {
	padding: 16px;
	background: var(--panel);
	border-radius: 8px;

	.e2e-notice {
		margin-bottom: 16px;
	}

	.question-preview {
		margin-bottom: 16px;
		padding: 12px;
		background: var(--bg);
		border-radius: 4px;

		.label {
			font-size: 0.85em;
			color: var(--fgTransparent);
			margin-bottom: 4px;
		}

		.text {
			white-space: pre-wrap;
			word-break: break-word;
		}

		.encrypted-text {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--infoFg);
			font-style: italic;
		}
	}

	.answer-textarea {
		margin-bottom: 8px;
	}

	.toolbar {
		display: flex;
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
	}

	.visibility-row {
		margin-bottom: 16px;

		.visibility-select {
			width: 200px;
		}
	}

	.card-option {
		margin-bottom: 16px;

		.card-preview-container {
			margin-top: 12px;
			padding: 8px;
			overflow-x: auto;
			background: var(--bg);
			border-radius: 8px;
		}
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
}
</style>
