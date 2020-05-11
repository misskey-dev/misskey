<template>
<div class="mk-messaging-room naked"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
>
	<template v-if="!fetching && user">
		<portal to="title"><mk-user-name :user="user" :nowrap="false" class="name"/></portal>
		<portal to="avatar"><mk-avatar class="avatar" :user="user" :disable-preview="true"/></portal>
	</template>
	<template v-if="!fetching && group">
		<portal to="icon"><fa :icon="faUsers"/></portal>
		<portal to="title">{{ group.name }}</portal>
	</template>

	<div class="body">
		<mk-loading v-if="fetching"/>
		<p class="empty" v-if="!fetching && messages.length == 0"><fa :icon="faInfoCircle"/>{{ $t('noMessagesYet') }}</p>
		<p class="no-history" v-if="!fetching && messages.length > 0 && !existMoreMessages"><fa :icon="faFlag"/>{{ $t('noMoreHistory') }}</p>
		<button class="more _button" ref="loadMore" :class="{ fetching: fetchingMoreMessages }" v-if="existMoreMessages" @click="fetchMoreMessages" :disabled="fetchingMoreMessages">
			<template v-if="fetchingMoreMessages"><fa icon="spinner" pulse fixed-width/></template>{{ fetchingMoreMessages ? $t('loading') : $t('loadMore') }}
		</button>
		<x-list class="messages" :items="messages" v-slot="{ item: message }" direction="up" reversed>
			<x-message :message="message" :is-group="group != null" :key="message.id"/>
		</x-list>
	</div>
	<footer>
		<transition name="fade">
			<div class="new-message" v-show="showIndicator">
				<button class="_buttonPrimary" @click="onIndicatorClick"><i><fa :icon="faArrowCircleDown"/></i>{{ $t('newMessageExists') }}</button>
			</div>
		</transition>
		<x-form v-if="!fetching" :user="user" :group="group" ref="form"/>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faArrowCircleDown, faFlag, faUsers, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import XList from '../../components/date-separated-list.vue';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import parseAcct from '../../../misc/acct/parse';

export default Vue.extend({
	i18n,

	components: {
		XMessage,
		XForm,
		XList
	},

	data() {
		return {
			fetching: true,
			user: null,
			group: null,
			fetchingMoreMessages: false,
			messages: [],
			existMoreMessages: false,
			connection: null,
			showIndicator: false,
			timer: null,
			ilObserver: new IntersectionObserver(
				(entries) => entries.some((entry) => entry.isIntersecting)
				&& !this.fetchingMoreMessages && this.existMoreMessages
					this.fetchMoreMessages()
			),
			faArrowCircleDown, faFlag, faUsers, faInfoCircle
		};
	},

	computed: {
		form(): any {
			return this.$refs.form;
		}
	},

	watch: {
		$route: 'fetch'
	},

	mounted() {
		this.fetch();
		if (this.$store.state.device.enableInfiniteScroll) {
			this.$nextTick(() => this.ilObserver.observe(this.$refs.loadMore));
		}
	},

	beforeDestroy() {
		this.connection.dispose();

		window.removeEventListener('scroll', this.onScroll);

		document.removeEventListener('visibilitychange', this.onVisibilitychange);

		this.ilObserver.disconnect();
	},

	methods: {
		async fetch() {
			this.fetching = true;
			if (this.$route.params.user) {
				const user = await this.$root.api('users/show', parseAcct(this.$route.params.user));
				this.user = user;
			} else {
				const group = await this.$root.api('users/groups/show', { groupId: this.$route.params.group });
				this.group = group;
			}

			this.connection = this.$root.stream.connectToChannel('messaging', {
				otherparty: this.user ? this.user.id : undefined,
				group: this.group ? this.group.id : undefined,
			});

			this.connection.on('message', this.onMessage);
			this.connection.on('read', this.onRead);
			this.connection.on('deleted', this.onDeleted);

			window.addEventListener('scroll', this.onScroll, { passive: true });

			document.addEventListener('visibilitychange', this.onVisibilitychange);

			this.fetchMessages().then(() => {
				this.fetching = false;
				this.scrollToBottom();
			});
		},

		onDragover(e) {
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == 'mk_drive_file';

			if (isFile || isDriveFile) {
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			} else {
				e.dataTransfer.dropEffect = 'none';
			}
		},

		onDrop(e): void {
			// ファイルだったら
			if (e.dataTransfer.files.length == 1) {
				this.form.upload(e.dataTransfer.files[0]);
				return;
			} else if (e.dataTransfer.files.length > 1) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('onlyOneFileCanBeAttached')
				});
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.form.file = file;
			}
			//#endregion
		},

		fetchMessages() {
			return new Promise((resolve, reject) => {
				const max = this.existMoreMessages ? 20 : 10;

				this.$root.api('messaging/messages', {
					userId: this.user ? this.user.id : undefined,
					groupId: this.group ? this.group.id : undefined,
					limit: max + 1,
					untilId: this.existMoreMessages ? this.messages[0].id : undefined
				}).then(messages => {
					if (messages.length == max + 1) {
						this.existMoreMessages = true;
						messages.pop();
					} else {
						this.existMoreMessages = false;
					}

					this.messages.unshift.apply(this.messages, messages.reverse());
					resolve();
				});
			});
		},

		fetchMoreMessages() {
			this.fetchingMoreMessages = true;
			this.fetchMessages().then(() => {
				this.fetchingMoreMessages = false;
			});
		},

		onMessage(message) {
			this.$root.sound('chat');

			const isBottom = this.isBottom();

			this.messages.push(message);
			if (message.userId != this.$store.state.i.id && !document.hidden) {
				this.connection.send('read', {
					id: message.id
				});
			}

			if (isBottom) {
				// Scroll to bottom
				this.$nextTick(() => {
					this.scrollToBottom();
				});
			} else if (message.userId != this.$store.state.i.id) {
				// Notify
				this.notifyNewMessage();
			}
		},

		onRead(x) {
			if (this.user) {
				if (!Array.isArray(x)) x = [x];
				for (const id of x) {
					if (this.messages.some(x => x.id == id)) {
						const exist = this.messages.map(x => x.id).indexOf(id);
						this.messages[exist].isRead = true;
					}
				}
			} else if (this.group) {
				for (const id of x.ids) {
					if (this.messages.some(x => x.id == id)) {
						const exist = this.messages.map(x => x.id).indexOf(id);
						this.messages[exist].reads.push(x.userId);
					}
				}
			}
		},

		onDeleted(id) {
			const msg = this.messages.find(m => m.id === id);
			if (msg) {
				this.messages = this.messages.filter(m => m.id !== msg.id);
			}
		},

		isBottom() {
			const asobi = 64;
			const current = this.isNaked
				? window.scrollY + window.innerHeight
				: this.$el.scrollTop + this.$el.offsetHeight;
			const max = this.isNaked
				? document.body.offsetHeight
				: this.$el.scrollHeight;
			return current > (max - asobi);
		},

		scrollToBottom() {
			window.scroll(0, document.body.offsetHeight);
		},

		onIndicatorClick() {
			this.showIndicator = false;
			this.scrollToBottom();
		},

		notifyNewMessage() {
			this.showIndicator = true;

			if (this.timer) clearTimeout(this.timer);

			this.timer = setTimeout(() => {
				this.showIndicator = false;
			}, 4000);
		},

		onScroll() {
			const el = this.isNaked ? window.document.documentElement : this.$el;
			const current = el.scrollTop + el.clientHeight;
			if (current > el.scrollHeight - 1) {
				this.showIndicator = false;
			}
		},

		onVisibilitychange() {
			if (document.hidden) return;
			for (const message of this.messages) {
				if (message.userId !== this.$store.state.i.id && !message.isRead) {
					this.connection.send('read', {
						id: message.id
					});
				}
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-messaging-room {

	> .body {
		width: 100%;

		> .empty {
			width: 100%;
			margin: 0;
			padding: 16px 8px 8px 8px;
			text-align: center;
			font-size: 0.8em;
			opacity: 0.5;

			[data-icon] {
				margin-right: 4px;
			}
		}

		> .no-history {
			display: block;
			margin: 0;
			padding: 16px;
			text-align: center;
			font-size: 0.8em;
			color: var(--messagingRoomInfo);
			opacity: 0.5;

			[data-icon] {
				margin-right: 4px;
			}
		}

		> .more {
			display: block;
			margin: 16px auto;
			padding: 0 12px;
			line-height: 24px;
			color: #fff;
			background: rgba(#000, 0.3);
			border-radius: 12px;

			&:hover {
				background: rgba(#000, 0.4);
			}

			&:active {
				background: rgba(#000, 0.5);
			}

			&.fetching {
				cursor: wait;
			}

			> [data-icon] {
				margin-right: 4px;
			}
		}

		> .messages {
			> ::v-deep * {
				margin-bottom: 16px;
			}
		}
	}

	> footer {
		width: 100%;

		> .new-message {
			position: absolute;
			top: -48px;
			width: 100%;
			padding: 8px 0;
			text-align: center;

			> button {
				display: inline-block;
				margin: 0;
				padding: 0 12px 0 30px;
				line-height: 32px;
				font-size: 12px;
				border-radius: 16px;

				> i {
					position: absolute;
					top: 0;
					left: 10px;
					line-height: 32px;
					font-size: 16px;
				}
			}
		}
	}
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
