<script setup lang="ts">
/**
 * user/noq.vue
 * ユーザーの質問箱ページ
 * - 質問送信フォーム
 * - 自分のページなら受信した質問一覧を表示（ステータスフィルタ付き）
 * - 回答フォームのモーダル表示
 * - 全ユーザーに回答済み質問一覧を公開表示（セキュリティ: 未回答質問は非表示）
 */
import { ref, computed, onMounted, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import MkContainer from '@/components/MkContainer.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkPagination from '@/components/MkPagination.vue';
import { Paginator } from '@/utility/paginator.js';
import NoqQuestionForm from '@/components/noq/NoqQuestionForm.vue';
import NoqQuestionList from '@/components/noq/NoqQuestionList.vue';
import NoqAnswerDialog from '@/components/noq/NoqAnswerDialog.vue';
import NoqReportDialog from '@/components/noq/NoqReportDialog.vue';
import NoqQuestionCard from '@/components/noq/NoqQuestionCard.vue';
import type { NoqQuestion } from '@/components/noq/NoqQuestionCard.vue';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

interface NoqSettings {
	isEnabled: boolean;
	requireUsernameDisclosure: boolean;
	notice: string | null;
	hasE2EKey: boolean;
	e2ePublicKey: string | null;
	user: Misskey.entities.UserLite;
}

interface MyNoqSettings {
	isEnabled: boolean;
	e2ePublicKey: string | null;
}

const noqSettings = ref<NoqSettings | null>(null);
const myNoqSettings = ref<MyNoqSettings | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const questionSent = ref(false);
const questionListRef = ref<InstanceType<typeof NoqQuestionList>>();

// 回答済み質問取得用のPaginatorインスタンス
// Paginatorクラスを使用し、computedParamsでuserIdを渡す
const answeredPaginatorComputedParams = computed(() => ({
	userId: props.user.id,
}));
const answeredPaginator = markRaw(new Paginator('noq/questions/answered', {
	limit: 20,
	computedParams: answeredPaginatorComputedParams,
}));

const isMyPage = computed(() => $i && $i.id === props.user.id);
const canAsk = computed(() => {
	if (!$i) return false;
	if (isMyPage.value) return false;
	if (!noqSettings.value?.isEnabled) return false;
	return true;
});

async function loadNoqSettings() {
	loading.value = true;
	error.value = null;
	try {
		// 相手の設定を取得
		noqSettings.value = await misskeyApi('noq/settings/show', {
			userId: props.user.id,
		}) as NoqSettings;

		// ログイン中なら自分の設定も取得（E2E暗号化判定用）
		if ($i) {
			try {
				myNoqSettings.value = await misskeyApi('noq/settings/get', {}) as MyNoqSettings;
			} catch {
				// 自分の設定取得に失敗しても続行
				myNoqSettings.value = null;
			}
		}
	} catch (err: unknown) {
		console.error(err);
		error.value = 'Failed to load question box settings';
	} finally {
		loading.value = false;
	}
}

function onQuestionSent() {
	questionSent.value = true;
	setTimeout(() => questionSent.value = false, 5000);
}

async function handleAnswer(question: NoqQuestion) {
	// 回答不要リクエストの場合は回答フォームを非表示（T512）
	if (question.isNoReplyRequested) {
		await os.alert({
			type: 'warning',
			title: i18n.ts._noq.noReplyRequested,
			text: i18n.ts._noq.noReplyRequestedMessage ?? 'この質問は回答不要としてマークされています。',
		});
		return;
	}

	// 回答フォームをモーダルで表示
	// disposeは一度だけ呼ばれるようにフラグで管理
	let disposed = false;
	const { dispose } = os.popup(NoqAnswerDialog, {
		question,
	}, {
		answered: (_noteId: string) => {
			// 回答完了後、質問リストをリロード
			questionListRef.value?.reload();
		},
		close: () => {
			// disposeは一度だけ呼ぶ
			if (!disposed) {
				disposed = true;
				dispose();
			}
		},
	});
}

async function handleDelete(question: NoqQuestion) {
	// NoqQuestionList内で削除処理とリロードが行われる
	console.log('Question deleted:', question.id);
}

async function handleReport(question: NoqQuestion) {
	// 通報ダイアログをモーダルで表示
	// disposeは一度だけ呼ばれるようにフラグで管理
	let disposed = false;
	const { dispose } = os.popup(NoqReportDialog, {
		question,
	}, {
		reported: () => {
			os.toast(String(i18n.ts.reported));
		},
		close: () => {
			// disposeは一度だけ呼ぶ
			if (!disposed) {
				disposed = true;
				dispose();
			}
		},
	});
}

async function handleMute(question: NoqQuestion) {
	if (!question.senderId) {
		console.error('[noq] Cannot mute: senderId is undefined');
		return;
	}

	// ミュート確認ダイアログ
	const confirmed = await os.confirm({
		type: 'warning',
		title: i18n.ts._noq.muteUser,
		text: i18n.ts._noq.muteUserConfirm,
	});

	if (confirmed.canceled) return;

	try {
		await misskeyApi('noq/mute/create', {
			userId: question.senderId,
		});
		os.toast(i18n.ts._noq.userMuted);
		questionListRef.value?.reload();
	} catch (err) {
		console.error('[noq] Failed to mute user:', err);
	}
}

onMounted(() => {
	loadNoqSettings();
});
</script>

<template>
<div class="noq-page">
	<div v-if="loading" class="loading">
		Loading...
	</div>

	<div v-else-if="error" class="error">
		{{ error }}
	</div>

	<template v-else>
		<!-- 質問箱が無効の場合 -->
		<MkInfo v-if="!noqSettings?.isEnabled" warn>
			{{ i18n.ts._noq.questionBoxDisabled }}
		</MkInfo>

		<!-- 質問送信フォーム（ログイン済みかつ他人のページ） -->
		<MkContainer v-if="canAsk" :foldable="false">
			<template #header>{{ i18n.ts._noq.askQuestion }}</template>

			<MkInfo v-if="questionSent" class="sent-message">
				{{ i18n.ts._noq.questionSent }}
			</MkInfo>

			<NoqQuestionForm
				:user="user"
				:require-username-disclosure="noqSettings?.requireUsernameDisclosure ?? false"
				:notice="noqSettings?.notice ?? null"
				:recipient-e2-e-public-key="noqSettings?.e2ePublicKey ?? null"
				:my-e2-e-public-key="myNoqSettings?.e2ePublicKey ?? null"
				@sent="onQuestionSent"
			/>
		</MkContainer>

		<!-- ログインしていない場合 -->
		<MkInfo v-else-if="!$i && noqSettings?.isEnabled">
			{{ i18n.ts._noq.loginRequired }}
		</MkInfo>

		<!-- 自分のページの場合：受信した質問一覧（ステータスフィルタ付き） -->
		<MkContainer v-if="isMyPage && noqSettings?.isEnabled" :foldable="false" class="received-questions">
			<template #header>{{ i18n.ts._noq.receivedQuestions }}</template>

			<NoqQuestionList
				ref="questionListRef"
				:show-actions="true"
				@answer="handleAnswer"
				@delete="handleDelete"
				@report="handleReport"
				@mute="handleMute"
			/>
		</MkContainer>

		<!-- 回答済み質問一覧（全ユーザーに公開表示） -->
		<!-- セキュリティ: APIは回答済み(status='answered')の質問のみを返す -->
		<MkContainer v-if="noqSettings?.isEnabled" :foldable="false" class="answered-questions">
			<template #header>{{ i18n.ts._noq.answeredQuestions }}</template>

			<MkPagination :paginator="answeredPaginator">
				<template #empty>
					<div class="empty">
						{{ i18n.ts._noq.noAnsweredQuestions }}
					</div>
				</template>
				<template #default="{ items }">
					<div class="answered-list">
						<NoqQuestionCard
							v-for="question in items"
							:key="question.id"
							:question="question as NoqQuestion"
							:show-actions="false"
						/>
					</div>
				</template>
			</MkPagination>
		</MkContainer>
	</template>
</div>
</template>

<style scoped lang="scss">
.noq-page {
	padding: 16px;

	.loading, .error {
		padding: 32px;
		text-align: center;
		color: var(--fgTransparent);
	}

	.error {
		color: var(--error);
	}

	.sent-message {
		margin: 16px;
	}

	.received-questions {
		margin-top: 24px;
	}

	.answered-questions {
		margin-top: 24px;

		.empty {
			padding: 32px;
			text-align: center;
			color: var(--fgTransparent);
		}

		.answered-list {
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
	}
}
</style>
