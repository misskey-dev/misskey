<script setup lang="ts">
/**
 * NoqQuestionCard.vue
 * 個別の質問カードコンポーネント
 * - 質問内容表示
 * - 送信者情報（開示されている場合）
 * - カードデザイン適用
 * - 回答・削除アクション
 */
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkUserName from '@/components/global/MkUserName.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkMfm from '@/components/global/MkMfm.js';

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
	senderId?: string;
	senderUsername?: string | null;
	senderHost?: string | null;
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
}>();

const cardClass = computed(() => `card-design-${props.question.cardDesign}`);
</script>

<template>
<div class="noq-question-card" :class="cardClass">
	<div class="header">
		<div v-if="question.sender" class="sender">
			<MkAvatar :user="question.sender" class="avatar" />
			<MkUserName :user="question.sender" />
		</div>
		<div v-else class="sender anonymous">
			{{ i18n.ts._noq.anonymous }}
		</div>
		<MkTime :time="question.createdAt" class="time" />
	</div>

	<div class="content">
		<!-- E2E暗号化質問の場合は暗号化表示 -->
		<div v-if="question.isE2EEncrypted" class="encrypted-indicator">
			<i class="ti ti-lock"></i>
			{{ i18n.ts._noq?.encryptedQuestion ?? '暗号化された質問' }}
		</div>
		<div class="text"><MkMfm :text="question.text" /></div>
		<img v-if="question.imageUrl" :src="question.imageUrl" class="image" />
	</div>

	<div v-if="question.isNoReplyRequested" class="no-reply-badge">
		{{ i18n.ts._noq.noReplyRequested }}
	</div>

	<div v-if="showActions && question.status === 'pending'" class="actions">
		<button class="action answer" @click="emit('answer', question)">
			{{ i18n.ts._noq.answer }}
		</button>
		<button class="action delete" @click="emit('delete', question)">
			{{ i18n.ts._noq.deleteQuestion }}
		</button>
		<button class="action report" @click="emit('report', question)">
			{{ i18n.ts._noq.reportQuestion }}
		</button>
		<button class="action mute" @click="emit('mute', question)">
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
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

	// カードデザインのスタイル
	&.card-design-default {
		border-left: 4px solid var(--accent);
	}

	&.card-design-blue_sky {
		border-left: 4px solid #87CEEB;
		background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), transparent);
	}

	&.card-design-love {
		border-left: 4px solid #FF69B4;
		background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), transparent);
	}

	&.card-design-nocturne {
		border-left: 4px solid #483D8B;
		background: linear-gradient(135deg, rgba(72, 61, 139, 0.1), transparent);
	}

	&.card-design-romantic {
		border-left: 4px solid #DB7093;
		background: linear-gradient(135deg, rgba(219, 112, 147, 0.1), transparent);
	}

	&.card-design-sakura {
		border-left: 4px solid #FFB7C5;
		background: linear-gradient(135deg, rgba(255, 183, 197, 0.1), transparent);
	}

	&.card-design-night_sky {
		border-left: 4px solid #191970;
		background: linear-gradient(135deg, rgba(25, 25, 112, 0.1), transparent);
	}

	&.card-design-pastel {
		border-left: 4px solid #B0E0E6;
		background: linear-gradient(135deg, rgba(176, 224, 230, 0.1), transparent);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;

		.sender {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: bold;

			.avatar {
				width: 32px;
				height: 32px;
			}

			&.anonymous {
				color: var(--fgTransparent);
				font-style: italic;
			}
		}

		.time {
			font-size: 0.85em;
			color: var(--fgTransparent);
		}
	}

	.content {
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

		.text {
			white-space: pre-wrap;
			word-break: break-word;
			line-height: 1.6;
		}

		.image {
			max-width: 100%;
			max-height: 300px;
			border-radius: 4px;
			margin-top: 12px;
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

	.actions {
		display: flex;
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

			&.report {
				background: var(--warn);
				color: #fff;
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
