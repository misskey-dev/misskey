<script setup lang="ts">
/**
 * NoqReportDialog.vue
 * 質問通報ダイアログ
 * - 通報理由入力
 * - noq/questions/report APIを呼び出し
 */
import { ref } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import type { NoqQuestion } from './NoqQuestionCard.vue';

const props = defineProps<{
	question: NoqQuestion;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'reported'): void;
}>();

const comment = ref('');
const isSubmitting = ref(false);

// モーダルウィンドウ参照
const modalRef = ref<InstanceType<typeof MkModalWindow>>();

async function submit() {
	if (!comment.value.trim()) return;

	isSubmitting.value = true;
	try {
		await misskeyApi('noq/questions/report', {
			questionId: props.question.id,
			comment: comment.value,
		});
		// 通報成功時はreportedを発火してモーダルを閉じる
		emit('reported');
		modalRef.value?.close();
	} catch (err) {
		console.error('[NoqReportDialog] Failed to report question:', err);
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
<MkModalWindow
	ref="modalRef"
	:width="400"
	@closed="emit('close')"
>
	<template #header>{{ i18n.ts._noq.reportQuestion }}</template>

	<div class="noq-report-dialog">
		<div class="description">
			{{ i18n.ts._noq.reportQuestionDescription }}
		</div>

		<MkTextarea
			v-model="comment"
			:placeholder="i18n.ts._noq.reportReasonPlaceholder"
			class="comment-input"
		/>

		<div class="actions">
			<MkButton @click="modalRef?.close()">
				{{ i18n.ts.cancel }}
			</MkButton>
			<MkButton
				primary
				:disabled="!comment.trim() || isSubmitting"
				@click="submit"
			>
				{{ i18n.ts._noq.submitReport }}
			</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<style scoped lang="scss">
.noq-report-dialog {
	padding: 16px;

	.description {
		margin-bottom: 16px;
		color: var(--fgTransparent);
		font-size: 0.9em;
	}

	.comment-input {
		margin-bottom: 16px;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
}
</style>
