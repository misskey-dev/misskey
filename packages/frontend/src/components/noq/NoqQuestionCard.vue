<script setup lang="ts">
/**
 * NoqQuestionCard.vue
 * 個別の質問カードコンポーネント
 * - NoqMessageCardを使用したカードデザインプレビュー
 * - 送信者情報（開示されている場合）
 * - 回答・削除アクション
 */
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkUserName from '@/components/global/MkUserName.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkTime from '@/components/global/MkTime.vue';
import NoqMessageCard from './NoqMessageCard.vue';

export interface NoqQuestion {
	id: string;
	text: string;
	imageUrl: string | null;
	isUsernameDisclosed: boolean;
	isNoReplyRequested: boolean;
	isE2EEncrypted: boolean;
	cardDesign: string;
	status: string;
	sender: Misskey.entities.UserLite | null;
	createdAt: string;
	answeredAt?: string | null;
	senderId?: string;
	senderUsername?: string | null;
	senderHost?: string | null;
	answerNoteId?: string | null;
}

const props = withDefaults(defineProps<{
	question: NoqQuestion;
	showActions?: boolean;
	isModerator?: boolean;
}>(), {
	showActions: false,
	isModerator: false,
});

const emit = defineEmits<{
	(ev: 'answer', question: NoqQuestion): void;
	(ev: 'delete', question: NoqQuestion): void;
	(ev: 'report', question: NoqQuestion): void;
	(ev: 'mute', question: NoqQuestion): void;
}>;
</script>

<template>
<div class="noq-question-card">
	<!-- メッセージカードプレビュー -->
	<div class="card-preview">
		<NoqMessageCard :question="question" />
	</div>

	<!-- メタ情報（送信者・日時） -->
	<div class="meta">
		<div class="sender-info">
			<div v-if="question.sender" class="sender">
				<MkAvatar :user="question.sender" class="avatar" />
				<MkUserName :user="question.sender" />
			</div>
			<div v-else class="sender anonymous">
				{{ i18n.ts._noq.anonymous }}
			</div>
		</div>
		<div class="timestamps">
			<div class="time">
				<MkTime :time="question.createdAt" />
			</div>
			<div v-if="question.status === 'answered' && question.answeredAt" class="time answered">
				<span class="label">{{ i18n.ts._noq?.answerDate ?? '回答' }}</span>
				<MkTime :time="question.answeredAt" />
			</div>
		</div>
	</div>

	<!-- E2E暗号化質問の場合は暗号化表示 -->
	<div v-if="question.isE2EEncrypted" class="encrypted-indicator">
		<i class="ti ti-lock"></i>
		{{ i18n.ts._noq?.encryptedQuestion ?? '暗号化された質問' }}
	</div>

	<div v-if="question.isNoReplyRequested" class="no-reply-badge">
		{{ i18n.ts._noq.noReplyRequested }}
	</div>

	<!-- 回答済みの場合: 回答ノートへのリンクを表示 -->
	<div v-if="question.status === 'answered' && question.answerNoteId" class="answer-link">
		<a :href="`/notes/${question.answerNoteId}`" class="view-answer">
			<i class="ti ti-message-check"></i>
			{{ i18n.ts._noq?.viewAnswer ?? '回答を見る' }}
		</a>
	</div>

	<!-- 未回答の場合: 回答ボタン -->
	<div v-if="showActions && question.status === 'pending'" class="actions">
		<button class="action answer" @click="emit('answer', question)">
			{{ i18n.ts._noq.answer }}
		</button>
	</div>

	<!-- 削除・通報・ミュートボタン（ステータスに関係なく表示） -->
	<div v-if="showActions" class="secondary-actions">
		<button class="action delete" @click="emit('delete', question)">
			{{ i18n.ts._noq.deleteQuestion }}
		</button>
		<button class="action report" @click="emit('report', question)">
			{{ i18n.ts._noq.reportQuestion }}
		</button>
		<button v-if="question.sender" class="action mute" @click="emit('mute', question)">
			{{ i18n.ts._noq.muteUser }}
		</button>
	</div>

	<!-- モデレーター向け: 送信者開示情報 -->
	<div v-if="isModerator && question.senderUsername" class="moderator-info">
		<span class="disclosed-sender">
			{{ i18n.ts._noq.disclosedSender }}: @{{ question.senderUsername }}{{ question.senderHost ? `@${question.senderHost}` : '' }}
		</span>
	</div>
</div>
</template>

<style scoped lang="scss">
.noq-question-card {
	background: var(--panel);
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

	// メッセージカードプレビュー
	.card-preview {
		margin-bottom: 12px;

		// NoqMessageCardのダウンロードボタンを非表示
		:deep(.card-actions) {
			display: none;
		}

		// Canvasのサイズを調整
		:deep(.card-canvas) {
			max-width: 100%;
			height: auto;
			border-radius: 8px;
		}
	}

	// メタ情報（送信者・日時）
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding: 8px 0;
		border-bottom: 1px solid var(--divider);

		.sender-info {
			.sender {
				display: flex;
				align-items: center;
				gap: 8px;
				font-weight: bold;

				.avatar {
					width: 28px;
					height: 28px;
				}

				&.anonymous {
					color: var(--fgTransparent);
					font-style: italic;
				}
			}
		}

		.timestamps {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 4px;

			.time {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 0.8em;
				color: var(--fgTransparent);

				.label {
					font-weight: bold;
					opacity: 0.7;
				}

				&.answered {
					color: var(--accent);
				}
			}
		}
	}

	// E2E暗号化インジケーター
	.encrypted-indicator {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: var(--infoBg);
		color: var(--infoFg);
		border-radius: 4px;
		font-size: 0.85em;
		margin-bottom: 8px;

		i {
			font-size: 1em;
		}
	}

	.no-reply-badge {
		margin-top: 12px;
		padding: 4px 8px;
		background: var(--infoWarnBg);
		color: var(--infoWarnFg);
		border-radius: 4px;
		font-size: 0.85em;
		display: inline-block;
	}

	.answer-link {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--divider);

		.view-answer {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 8px 16px;
			background: var(--accent);
			color: var(--fgOnAccent);
			border-radius: 4px;
			text-decoration: none;
			font-size: 0.9em;

			&:hover {
				opacity: 0.8;
			}
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--divider);

		.action {
			padding: 8px 16px;
			border-radius: 4px;
			border: none;
			cursor: pointer;
			font-size: 0.9em;

			&.answer {
				background: var(--accent);
				color: var(--fgOnAccent);
			}

			&.delete {
				background: var(--buttonBg);
				color: var(--fg);
			}

			&:hover {
				opacity: 0.8;
			}
		}
	}

	.secondary-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;

		.action {
			padding: 6px 12px;
			border-radius: 4px;
			border: none;
			cursor: pointer;
			font-size: 0.85em;

			&.delete {
				background: var(--buttonBg);
				color: var(--fg);
			}

			&.report {
				background: var(--buttonBg);
				color: var(--warn);
			}

			&.mute {
				background: var(--buttonBg);
				color: var(--fg);
			}

			&:hover {
				opacity: 0.8;
			}
		}
	}

	.moderator-info {
		margin-top: 12px;
		padding: 8px 12px;
		background: var(--infoWarnBg);
		border-radius: 4px;
		font-size: 0.85em;

		.disclosed-sender {
			color: var(--infoWarnFg);
			font-weight: bold;
		}
	}
}
</style>
