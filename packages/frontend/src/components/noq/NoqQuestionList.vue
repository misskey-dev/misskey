<script setup lang="ts">
/**
 * NoqQuestionList.vue
 * 質問一覧表示コンポーネント
 * - ステータスフィルタ（未回答/回答済み/全て）
 * - ページネーション
 * - 質問カード表示
 * - 削除・回答アクション
 */
import { ref, computed, watch, markRaw } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkSelect, { type MkSelectItem } from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import { Paginator } from '@/utility/paginator.js';
import NoqQuestionCard from './NoqQuestionCard.vue';
import type { NoqQuestion } from './NoqQuestionCard.vue';

const props = withDefaults(defineProps<{
	showActions?: boolean;
	isModerator?: boolean;
}>(), {
	showActions: true,
	isModerator: false,
});

const emit = defineEmits<{
	(e: 'answer', question: NoqQuestion): void;
	(e: 'delete', question: NoqQuestion): void;
	(e: 'report', question: NoqQuestion): void;
	(e: 'mute', question: NoqQuestion): void;
}>();

// ステータスフィルタ
type StatusFilter = 'pending' | 'answered' | 'all';
const statusFilter = ref<StatusFilter>('pending');

// ステータスフィルタオプション
const statusFilterItems: MkSelectItem<StatusFilter>[] = [
	{ value: 'pending', label: i18n.ts._noq.statusPending ?? '未回答' },
	{ value: 'answered', label: i18n.ts._noq.statusAnswered ?? '回答済み' },
	{ value: 'all', label: i18n.ts._noq.statusAll ?? 'すべて' },
];

// Paginatorインスタンスを作成
// ステータスフィルタに応じてcomputedParamsを更新
const computedParams = computed(() => {
	if (statusFilter.value === 'all') {
		return {};
	}
	return { status: statusFilter.value };
});

const paginator = markRaw(new Paginator('noq/questions/received', {
	limit: 20,
	computedParams,
}));

async function handleAnswer(question: NoqQuestion) {
	emit('answer', question);
}

async function handleDelete(question: NoqQuestion) {
	if (!confirm(i18n.ts._noq.deleteQuestionConfirm)) return;

	try {
		await misskeyApi('noq/questions/delete', {
			questionId: question.id,
		});
		// ページネーションをリロード
		paginator.reload();
	} catch (err) {
		console.error('[NoqQuestionList] Failed to delete question:', err);
	}
}

async function handleReport(question: NoqQuestion) {
	emit('report', question);
}

async function handleMute(question: NoqQuestion) {
	emit('mute', question);
}

// 外部からリロードを呼び出せるように公開
defineExpose({
	reload: () => paginator.reload(),
});
</script>

<template>
<div class="noq-question-list">
	<!-- ステータスフィルタ -->
	<div class="filter-bar">
		<MkSelect v-model="statusFilter" :items="statusFilterItems" class="status-select"/>
	</div>

	<!-- 質問一覧 -->
	<MkPagination :paginator="paginator">
		<template #empty>
			<div class="no-questions">
				{{ i18n.ts._noq.noQuestions }}
			</div>
		</template>
		<template #default="{ items }">
			<div class="question-items">
				<NoqQuestionCard
					v-for="question in items"
					:key="question.id"
					:question="question as NoqQuestion"
					:show-actions="showActions"
					:is-moderator="isModerator"
					@answer="handleAnswer"
					@delete="handleDelete"
					@report="handleReport"
					@mute="handleMute"
				/>
			</div>
		</template>
	</MkPagination>
</div>
</template>

<style scoped lang="scss">
.noq-question-list {
	.filter-bar {
		display: flex;
		justify-content: flex-end;
		padding: 8px 16px;
		border-bottom: 1px solid var(--divider);

		.status-select {
			width: 200px;
		}
	}

	.no-questions {
		padding: 32px;
		text-align: center;
		color: var(--fgTransparent);
	}

	.question-items {
		display: flex;
		flex-direction: column;
	}
}
</style>
