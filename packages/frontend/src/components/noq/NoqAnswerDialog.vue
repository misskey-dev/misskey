<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<script setup lang="ts">
/**
 * NoqAnswerDialog.vue
 * 回答フォームをモーダルウィンドウとして表示するダイアログ
 * - MkModalWindowでラップしてサイドバーを考慮した中央表示
 * - NoqAnswerFormの機能をそのまま使用
 */
import { ref, computed, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { uploadFile } from '@/utility/drive.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { encrypt as encryptE2E, isValidPublicKey } from '@/utility/noq-crypto.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import Mfm from '@/components/global/MkMfm.js';
import NoqMessageCard from './NoqMessageCard.vue';
import type { NoqQuestion } from './NoqQuestionCard.vue';

const props = defineProps<{
	question: NoqQuestion;
	senderE2EPublicKey?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'answered', noteId: string): void;
	(ev: 'close'): void;
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

// モーダルウィンドウ参照
const modalRef = ref<InstanceType<typeof MkModalWindow>>();

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

// 質問文が長い（CW省略が発生する）かどうか
// CW形式: 「Q. {質問文} (@username) #Noquestion」で100文字制限
// 質問文が約85文字を超えるとCWで省略される
const isQuestionTextLong = computed(() => props.question.text.length > 85);

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

// CWテキスト（質問内容 + ハッシュタグ）
// 仕様: 「Q. {質問文} #Noquestion」形式
// CWは最大100文字制限があるため、長い質問は省略する
// username開示ありの場合のみ質問者情報を表示
const cwText = computed(() => {
	// 質問者情報は開示されている場合のみ表示（匿名の場合は表示しない）
	const senderInfo = props.question.sender ? ` (@${props.question.sender.username})` : '';
	const suffix = `${senderInfo} #Noquestion`;
	const prefix = 'Q. ';
	// CW上限100文字から prefix と suffix の長さを引いた残りが質問文に使える文字数
	const maxQuestionLength = 100 - prefix.length - suffix.length;
	let questionText = props.question.text;
	if (questionText.length > maxQuestionLength) {
		// 省略する場合は「...」を付加（3文字分確保）
		questionText = questionText.substring(0, maxQuestionLength - 3) + '...';
	}
	return `${prefix}${questionText}${suffix}`;
});

// 本文（回答 + 質問箱リンク + ハッシュタグ）
// 仕様: メッセージカード添付時も回答テキストは本文に含める（カードには質問のみ表示）
const noteText = computed(() => {
	const questionBoxUrl = `https://noc.ski/@${$i?.username}/noq`;
	return `A. ${answerText.value}\n#Noquestion\n[質問する](${questionBoxUrl})`;
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

			// 回答成功時はansweredを発火してモーダルを閉じる
			emit('answered', '');
			modalRef.value?.close();
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

		// 質問ステータスを回答済みに更新（回答テキストも保存）
		await misskeyApi('noq/questions/answer', {
			questionId: props.question.id,
			noteId: note.createdNote.id,
			answerText: pureAnswerText.value,
		});

		// 回答成功時はansweredを発火してモーダルを閉じる
		emit('answered', note.createdNote.id);
		modalRef.value?.close();
	} catch (err: unknown) {
		console.error('[NoqAnswerDialog] Failed to post answer:', err);
		// ユーザーにエラーを表示
		// Misskey APIエラーは { message, code, id, info } 形式
		let errorMessage: string;
		if (err && typeof err === 'object') {
			const apiErr = err as { message?: string; code?: string; id?: string; info?: unknown };
			if (apiErr.message) {
				errorMessage = apiErr.code ? `${apiErr.message} (${apiErr.code})` : apiErr.message;
			} else if (apiErr.code) {
				errorMessage = apiErr.code;
			} else {
				errorMessage = JSON.stringify(err);
			}
		} else {
			errorMessage = String(err);
		}
		os.alert({
			type: 'error',
			title: i18n.ts._noq?.answerFailed ?? '回答の送信に失敗しました',
			text: errorMessage,
		});
	} finally {
		posting.value = false;
	}
}
</script>

<template>
<!-- withCloseButton=false: ヘッダーの閉じるボタンは機能しないため非表示、キャンセルボタンで代用 -->
<MkModalWindow
	ref="modalRef"
	:width="600"
	:withCloseButton="false"
	@closed="emit('close')"
>
	<template #header>
		<i class="ti ti-message-reply"></i>
		{{ i18n.ts._noq.answer }}
	</template>

	<div class="noq-answer-dialog">
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
			<Mfm v-else :text="question.text" class="text" />
		</div>

		<!-- 回答入力 -->
		<MkTextarea
			v-model="answerText"
			:placeholder="i18n.ts._noq.answerPlaceholder ?? '回答を入力...'"
			:mfmAutocomplete="true"
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
			<!-- 長い質問文の場合、メッセージカード添付を推奨 -->
			<MkInfo v-if="isQuestionTextLong && !includeCard" class="long-question-hint">
				{{ i18n.ts._noq?.longQuestionHint ?? '質問文が長いため、CWでは省略されます。メッセージカードの添付がおすすめです。' }}
			</MkInfo>

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
				/>
			</div>
		</div>

		<!-- アクションボタン -->
		<div class="actions">
			<MkButton @click="modalRef?.close()">
				{{ i18n.ts.cancel }}
			</MkButton>
			<MkButton primary :disabled="posting || !answerText.trim()" @click="postAnswer">
				{{ posting ? i18n.ts.sending : i18n.ts._noq.answer }}
			</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<style scoped lang="scss">
.noq-answer-dialog {
	padding: 16px;

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

		.long-question-hint {
			margin-bottom: 8px;
		}

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
