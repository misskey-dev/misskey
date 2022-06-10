<template>
<MkSpacer :content-max="800">
	<div v-size="{ max: [400] }" class="yweeujhr">
		<MkButton primary class="start" @click="start"><i class="fas fa-plus"></i> {{ $ts.startMessaging }}</MkButton>

		<div v-if="messages.length > 0" class="history">
			<MkA v-for="(message, i) in messages"
				:key="message.id"
				v-anim="i"
				class="message _block"
				:class="{ isMe: isMe(message), isRead: message.groupId ? message.reads.includes($i.id) : message.isRead }"
				:to="message.groupId ? `/my/messaging/group/${message.groupId}` : `/my/messaging/${getAcct(isMe(message) ? message.recipient : message.user)}`"
				:data-index="i"
			>
				<div>
					<MkAvatar class="avatar" :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user" :show-indicator="true"/>
					<header v-if="message.groupId">
						<span class="name">{{ message.group.name }}</span>
						<MkTime :time="message.createdAt" class="time"/>
					</header>
					<header v-else>
						<span class="name"><MkUserName :user="isMe(message) ? message.recipient : message.user"/></span>
						<span class="username">@{{ acct(isMe(message) ? message.recipient : message.user) }}</span>
						<MkTime :time="message.createdAt" class="time"/>
					</header>
					<div class="body">
						<p class="text"><span v-if="isMe(message)" class="me">{{ $ts.you }}:</span>{{ message.text }}</p>
					</div>
				</div>
			</MkA>
		</div>
		<div v-if="!fetching && messages.length == 0" class="_fullinfo">
			<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
			<div>{{ $ts.noHistory }}</div>
		</div>
		<MkLoading v-if="fetching"/>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, markRaw } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import MkButton from '@/components/ui/button.vue';
import { acct } from '@/filters/user';
import * as os from '@/os';
import { stream } from '@/stream';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.messaging,
				icon: 'fas fa-comments',
				bg: 'var(--bg)',
			},
			fetching: true,
			moreFetching: false,
			messages: [],
			connection: null,
		};
	},

	mounted() {
		this.connection = markRaw(stream.useChannel('messagingIndex'));

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		os.api('messaging/history', { group: false }).then(userMessages => {
			os.api('messaging/history', { group: true }).then(groupMessages => {
				const messages = userMessages.concat(groupMessages);
				messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				this.messages = messages;
				this.fetching = false;
			});
		});
	},

	beforeUnmount() {
		this.connection.dispose();
	},

	methods: {
		getAcct: Acct.toString,

		isMe(message) {
			return message.userId === this.$i.id;
		},

		onMessage(message) {
			if (message.recipientId) {
				this.messages = this.messages.filter(m => !(
					(m.recipientId === message.recipientId && m.userId === message.userId) ||
					(m.recipientId === message.userId && m.userId === message.recipientId)));

				this.messages.unshift(message);
			} else if (message.groupId) {
				this.messages = this.messages.filter(m => m.groupId !== message.groupId);
				this.messages.unshift(message);
			}
		},

		onRead(ids) {
			for (const id of ids) {
				const found = this.messages.find(m => m.id === id);
				if (found) {
					if (found.recipientId) {
						found.isRead = true;
					} else if (found.groupId) {
						found.reads.push(this.$i.id);
					}
				}
			}
		},

		start(ev) {
			os.popupMenu([{
				text: this.$ts.messagingWithUser,
				icon: 'fas fa-user',
				action: () => { this.startUser(); }
			}, {
				text: this.$ts.messagingWithGroup,
				icon: 'fas fa-users',
				action: () => { this.startGroup(); }
			}], ev.currentTarget ?? ev.target);
		},

		async startUser() {
			os.selectUser().then(user => {
				this.$router.push(`/my/messaging/${Acct.toString(user)}`);
			});
		},

		async startGroup() {
			const groups1 = await os.api('users/groups/owned');
			const groups2 = await os.api('users/groups/joined');
			if (groups1.length === 0 && groups2.length === 0) {
				os.alert({
					type: 'warning',
					title: this.$ts.youHaveNoGroups,
					text: this.$ts.joinOrCreateGroup,
				});
				return;
			}
			const { canceled, result: group } = await os.select({
				title: this.$ts.group,
				items: groups1.concat(groups2).map(group => ({
					value: group, text: group.name
				}))
			});
			if (canceled) return;
			this.$router.push(`/my/messaging/group/${group.id}`);
		},

		acct
	}
});
</script>

<style lang="scss" scoped>
.yweeujhr {

	> .start {
		margin: 0 auto var(--margin) auto;
	}

	> .history {
		> .message {
			display: block;
			text-decoration: none;
			margin-bottom: var(--margin);

			* {
				pointer-events: none;
				user-select: none;
			}

			&:hover {
				.avatar {
					filter: saturate(200%);
				}
			}

			&:active {
			}

			&.isRead,
			&.isMe {
				opacity: 0.8;
			}

			&:not(.isMe):not(.isRead) {
				> div {
					background-image: url("/client-assets/unread.svg");
					background-repeat: no-repeat;
					background-position: 0 center;
				}
			}

			&:after {
				content: "";
				display: block;
				clear: both;
			}

			> div {
				padding: 20px 30px;

				&:after {
					content: "";
					display: block;
					clear: both;
				}

				> header {
					display: flex;
					align-items: center;
					margin-bottom: 2px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						margin: 0;
						padding: 0;
						overflow: hidden;
						text-overflow: ellipsis;
						font-size: 1em;
						font-weight: bold;
						transition: all 0.1s ease;
					}

					> .username {
						margin: 0 8px;
					}

					> .time {
						margin: 0 0 0 auto;
					}
				}

				> .avatar {
					float: left;
					width: 54px;
					height: 54px;
					margin: 0 16px 0 0;
					border-radius: 8px;
					transition: all 0.1s ease;
				}

				> .body {

					> .text {
						display: block;
						margin: 0 0 0 0;
						padding: 0;
						overflow: hidden;
						overflow-wrap: break-word;
						font-size: 1.1em;
						color: var(--faceText);

						.me {
							opacity: 0.7;
						}
					}

					> .image {
						display: block;
						max-width: 100%;
						max-height: 512px;
					}
				}
			}
		}
	}

	&.max-width_400px {
		> .history {
			> .message {
				&:not(.isMe):not(.isRead) {
					> div {
						background-image: none;
						border-left: solid 4px #3aa2dc;
					}
				}

				> div {
					padding: 16px;
					font-size: 0.9em;

					> .avatar {
						margin: 0 12px 0 0;
					}
				}
			}
		}
	}
}
</style>
