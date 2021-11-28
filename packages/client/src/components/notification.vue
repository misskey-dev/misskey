<template>
<div ref="elRef" v-size="{ max: [500, 600] }" class="qglefbjs" :class="notification.type">
	<div class="head">
		<MkAvatar v-if="notification.user" class="icon" :user="notification.user"/>
		<img v-else-if="notification.icon" class="icon" :src="notification.icon" alt=""/>
		<div class="sub-icon" :class="notification.type">
			<i v-if="notification.type === 'follow'" class="fas fa-plus"></i>
			<i v-else-if="notification.type === 'receiveFollowRequest'" class="fas fa-clock"></i>
			<i v-else-if="notification.type === 'followRequestAccepted'" class="fas fa-check"></i>
			<i v-else-if="notification.type === 'groupInvited'" class="fas fa-id-card-alt"></i>
			<i v-else-if="notification.type === 'renote'" class="fas fa-retweet"></i>
			<i v-else-if="notification.type === 'reply'" class="fas fa-reply"></i>
			<i v-else-if="notification.type === 'mention'" class="fas fa-at"></i>
			<i v-else-if="notification.type === 'quote'" class="fas fa-quote-left"></i>
			<i v-else-if="notification.type === 'pollVote'" class="fas fa-poll-h"></i>
			<!-- notification.reaction が null になることはまずないが、ここでoptional chaining使うと一部ブラウザで刺さるので念の為 -->
			<XReactionIcon v-else-if="notification.type === 'reaction'"
				ref="reactionRef"
				:reaction="notification.reaction ? notification.reaction.replace(/^:(\w+):$/, ':$1@.:') : notification.reaction"
				:custom-emojis="notification.note.emojis"
				:no-style="true"
				@touchstart.passive="onReactionMouseover"
				@mouseover="onReactionMouseover"
				@mouseleave="onReactionMouseleave"
				@touchend="onReactionMouseleave"
			/>
		</div>
	</div>
	<div class="tail">
		<header>
			<MkA v-if="notification.user" v-user-preview="notification.user.id" class="name" :to="userPage(notification.user)"><MkUserName :user="notification.user"/></MkA>
			<span v-else>{{ notification.header }}</span>
			<MkTime v-if="withTime" :time="notification.createdAt" class="time"/>
		</header>
		<MkA v-if="notification.type === 'reaction'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
			<i class="fas fa-quote-left"></i>
			<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.emojis"/>
			<i class="fas fa-quote-right"></i>
		</MkA>
		<MkA v-if="notification.type === 'renote'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note.renote)">
			<i class="fas fa-quote-left"></i>
			<Mfm :text="getNoteSummary(notification.note.renote)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.renote.emojis"/>
			<i class="fas fa-quote-right"></i>
		</MkA>
		<MkA v-if="notification.type === 'reply'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
			<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.emojis"/>
		</MkA>
		<MkA v-if="notification.type === 'mention'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
			<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.emojis"/>
		</MkA>
		<MkA v-if="notification.type === 'quote'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
			<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.emojis"/>
		</MkA>
		<MkA v-if="notification.type === 'pollVote'" class="text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
			<i class="fas fa-quote-left"></i>
			<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="!full" :custom-emojis="notification.note.emojis"/>
			<i class="fas fa-quote-right"></i>
		</MkA>
		<span v-if="notification.type === 'follow'" class="text" style="opacity: 0.6;">{{ $ts.youGotNewFollower }}<div v-if="full"><MkFollowButton :user="notification.user" :full="true"/></div></span>
		<span v-if="notification.type === 'followRequestAccepted'" class="text" style="opacity: 0.6;">{{ $ts.followRequestAccepted }}</span>
		<span v-if="notification.type === 'receiveFollowRequest'" class="text" style="opacity: 0.6;">{{ $ts.receiveFollowRequest }}<div v-if="full && !followRequestDone"><button class="_textButton" @click="acceptFollowRequest()">{{ $ts.accept }}</button> | <button class="_textButton" @click="rejectFollowRequest()">{{ $ts.reject }}</button></div></span>
		<span v-if="notification.type === 'groupInvited'" class="text" style="opacity: 0.6;">{{ $ts.groupInvited }}: <b>{{ notification.invitation.group.name }}</b><div v-if="full && !groupInviteDone"><button class="_textButton" @click="acceptGroupInvitation()">{{ $ts.accept }}</button> | <button class="_textButton" @click="rejectGroupInvitation()">{{ $ts.reject }}</button></div></span>
		<span v-if="notification.type === 'app'" class="text">
			<Mfm :text="notification.body" :nowrap="!full"/>
		</span>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import * as misskey from 'misskey-js';
import { getNoteSummary } from '@/scripts/get-note-summary';
import XReactionIcon from './reaction-icon.vue';
import MkFollowButton from './follow-button.vue';
import XReactionTooltip from './reaction-tooltip.vue';
import { notePage } from '@/filters/note';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';

export default defineComponent({
	components: {
		XReactionIcon, MkFollowButton
	},

	props: {
		notification: {
			type: Object,
			required: true,
		},
		withTime: {
			type: Boolean,
			required: false,
			default: false,
		},
		full: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	setup(props) {
		const elRef = ref<HTMLElement>(null);
		const reactionRef = ref(null);

		onMounted(() => {
			if (!props.notification.isRead) {
				const readObserver = new IntersectionObserver((entries, observer) => {
					if (!entries.some(entry => entry.isIntersecting)) return;
					os.stream.send('readNotification', {
						id: props.notification.id
					});
					observer.disconnect();
				});

				readObserver.observe(elRef.value);

				const connection = os.stream.useChannel('main');
				connection.on('readAllNotifications', () => readObserver.disconnect());

				onUnmounted(() => {
					readObserver.disconnect();
					connection.dispose();
				});
			}
		});

		const followRequestDone = ref(false);
		const groupInviteDone = ref(false);

		const acceptFollowRequest = () => {
			followRequestDone.value = true;
			os.api('following/requests/accept', { userId: props.notification.user.id });
		};

		const rejectFollowRequest = () => {
			followRequestDone.value = true;
			os.api('following/requests/reject', { userId: props.notification.user.id });
		};

		const acceptGroupInvitation = () => {
			groupInviteDone.value = true;
			os.apiWithDialog('users/groups/invitations/accept', { invitationId: props.notification.invitation.id });
		};

		const rejectGroupInvitation = () => {
			groupInviteDone.value = true;
			os.api('users/groups/invitations/reject', { invitationId: props.notification.invitation.id });
		};

		const { onMouseover: onReactionMouseover, onMouseleave: onReactionMouseleave } = useTooltip((showing) => {
			os.popup(XReactionTooltip, {
				showing,
				reaction: props.notification.reaction ? props.notification.reaction.replace(/^:(\w+):$/, ':$1@.:') : props.notification.reaction,
				emojis: props.notification.note.emojis,
				source: reactionRef.value.$el,
			}, {}, 'closed');
		});

		return {
			getNoteSummary: (note: misskey.entities.Note) => getNoteSummary(note),
			followRequestDone,
			groupInviteDone,
			notePage,
			userPage,
			acceptFollowRequest,
			rejectFollowRequest,
			acceptGroupInvitation,
			rejectGroupInvitation,
			onReactionMouseover,
			onReactionMouseleave,
			elRef,
			reactionRef,
		};
	},
});
</script>

<style lang="scss" scoped>
.qglefbjs {
	position: relative;
	box-sizing: border-box;
	padding: 24px 32px;
	font-size: 0.9em;
	overflow-wrap: break-word;
	display: flex;
	contain: content;

	&.max-width_600px {
		padding: 16px;
		font-size: 0.9em;
	}

	&.max-width_500px {
		padding: 12px;
		font-size: 0.8em;
	}

	&:after {
		content: "";
		display: block;
		clear: both;
	}

	> .head {
		position: sticky;
		top: 0;
		flex-shrink: 0;
		width: 42px;
		height: 42px;
		margin-right: 8px;

		> .icon {
			display: block;
			width: 100%;
			height: 100%;
			border-radius: 6px;
		}

		> .sub-icon {
			position: absolute;
			z-index: 1;
			bottom: -2px;
			right: -2px;
			width: 20px;
			height: 20px;
			box-sizing: border-box;
			border-radius: 100%;
			background: var(--panel);
			box-shadow: 0 0 0 3px var(--panel);
			font-size: 12px;
			text-align: center;

			&:empty {
				display: none;
			}

			> * {
				color: #fff;
				width: 100%;
				height: 100%;
			}

			&.follow, &.followRequestAccepted, &.receiveFollowRequest, &.groupInvited {
				padding: 3px;
				background: #36aed2;
				pointer-events: none;
			}

			&.renote {
				padding: 3px;
				background: #36d298;
				pointer-events: none;
			}

			&.quote {
				padding: 3px;
				background: #36d298;
				pointer-events: none;
			}

			&.reply {
				padding: 3px;
				background: #007aff;
				pointer-events: none;
			}

			&.mention {
				padding: 3px;
				background: #88a6b7;
				pointer-events: none;
			}

			&.pollVote {
				padding: 3px;
				background: #88a6b7;
				pointer-events: none;
			}
		}
	}

	> .tail {
		flex: 1;
		min-width: 0;

		> header {
			display: flex;
			align-items: baseline;
			white-space: nowrap;

			> .name {
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0;
				overflow: hidden;
			}

			> .time {
				margin-left: auto;
				font-size: 0.9em;
			}
		}

		> .text {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			> i {
				vertical-align: super;
				font-size: 50%;
				opacity: 0.5;
			}

			> i:first-child {
				margin-right: 4px;
			}

			> i:last-child {
				margin-left: 4px;
			}
		}
	}
}
</style>
