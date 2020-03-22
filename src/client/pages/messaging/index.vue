<template>
<div class="mk-messaging">
	<portal to="icon"><fa :icon="faComments"/></portal>
	<portal to="title">{{ $t('messaging') }}</portal>

	<mk-button @click="start" primary class="start"><fa :icon="faPlus"/> {{ $t('startMessaging') }}</mk-button>

	<div class="history" v-if="messages.length > 0">
		<router-link v-for="(message, i) in messages"
			class="message _panel"
			:to="message.groupId ? `/my/messaging/group/${message.groupId}` : `/my/messaging/${getAcct(isMe(message) ? message.recipient : message.user)}`"
			:data-is-me="isMe(message)"
			:data-is-read="message.groupId ? message.reads.includes($store.state.i.id) : message.isRead"
			:data-index="i"
			:key="message.id"
		>
			<div>
				<mk-avatar class="avatar" :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user"/>
				<header v-if="message.groupId">
					<span class="name">{{ message.group.name }}</span>
					<mk-time :time="message.createdAt"/>
				</header>
				<header v-else>
					<span class="name"><mk-user-name :user="isMe(message) ? message.recipient : message.user"/></span>
					<span class="username">@{{ isMe(message) ? message.recipient : message.user | acct }}</span>
					<mk-time :time="message.createdAt"/>
				</header>
				<div class="body">
					<p class="text"><span class="me" v-if="isMe(message)">{{ $t('you') }}:</span>{{ message.text }}</p>
				</div>
			</div>
		</router-link>
	</div>
	<div class="no-history" v-if="!fetching && messages.length == 0">
		<img src="https://xn--931a.moe/assets/info.png" class="_ghost"/>
		<div>{{ $t('noHistory') }}</div>
	</div>
	<mk-loading v-if="fetching"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faUser, faUsers, faComments, faPlus } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import getAcct from '../../../misc/acct/render';
import MkButton from '../../components/ui/button.vue';
import MkUserSelect from '../../components/user-select.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			messages: [],
			connection: null,
			faUser, faUsers, faComments, faPlus
		};
	},

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('messagingIndex');

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		this.$root.api('messaging/history', { group: false }).then(userMessages => {
			this.$root.api('messaging/history', { group: true }).then(groupMessages => {
				const messages = userMessages.concat(groupMessages);
				messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				this.messages = messages;
				this.fetching = false;
			});
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		getAcct,

		isMe(message) {
			return message.userId == this.$store.state.i.id;
		},

		onMessage(message) {
			if (message.recipientId) {
				this.messages = this.messages.filter(m => !(
					(m.recipientId == message.recipientId && m.userId == message.userId) ||
					(m.recipientId == message.userId && m.userId == message.recipientId)));

				this.messages.unshift(message);
			} else if (message.groupId) {
				this.messages = this.messages.filter(m => m.groupId !== message.groupId);
				this.messages.unshift(message);
			}
		},

		onRead(ids) {
			for (const id of ids) {
				const found = this.messages.find(m => m.id == id);
				if (found) {
					if (found.recipientId) {
						found.isRead = true;
					} else if (found.groupId) {
						found.reads.push(this.$store.state.i.id);
					}
				}
			}
		},

		start(ev) {
			this.$root.menu({
				items: [{
					text: this.$t('messagingWithUser'),
					icon: faUser,
					action: () => { this.startUser() }
				}, {
					text: this.$t('messagingWithGroup'),
					icon: faUsers,
					action: () => { this.startGroup() }
				}],
				noCenter: true,
				source: ev.currentTarget || ev.target,
			});
		},

		async startUser() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				this.$router.push(`/my/messaging/${getAcct(user)}`);
			});
		},

		async startGroup() {
			const groups1 = await this.$root.api('users/groups/owned');
			const groups2 = await this.$root.api('users/groups/joined');
			if (groups1.length === 0 && groups2.length === 0) {
				this.$root.dialog({
					type: 'warning',
					title: this.$t('youHaveNoGroups'),
					text: this.$t('joinOrCreateGroup'),
				});
				return;
			}
			const { canceled, result: group } = await this.$root.dialog({
				type: null,
				title: this.$t('group'),
				select: {
					items: groups1.concat(groups2).map(group => ({
						value: group, text: group.name
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.$router.push(`/my/messaging/group/${group.id}`);
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-messaging {

	> .start {
		margin: 0 auto 16px auto;
	}

	> .history {
		> .message {
			display: block;
			text-decoration: none;
			margin-bottom: 16px;

			@media (max-width: 500px) {
				margin-bottom: 8px;
			}

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

			&[data-is-read],
			&[data-is-me] {
				opacity: 0.8;
			}

			&:not([data-is-me]):not([data-is-read]) {
				> div {
					background-image: url("/assets/unread.svg");
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

					> .mk-time {
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

	> .no-history {
		padding: 32px;
		text-align: center;

		> img {
			vertical-align: bottom;
			height: 128px;
			margin-bottom: 16px;
			border-radius: 16px;
		}
	}

	@media (max-width: 400px) {
		> .history {
			> .message {
				&:not([data-is-me]):not([data-is-read]) {
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
