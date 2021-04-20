<template>
<div class="_section"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
>
	<div class="_content mk-messaging-room">
		<div class="body">
			<MkLoading v-if="fetching"/>
			<p class="empty" v-if="!fetching && messages.length == 0"><i class="fas fa-info-circle"></i>{{ $ts.noMessagesYet }}</p>
			<p class="no-history" v-if="!fetching && messages.length > 0 && !existMoreMessages"><i class="fas fa-flag"></i>{{ $ts.noMoreHistory }}</p>
			<button class="more _button" ref="loadMore" :class="{ fetching: fetchingMoreMessages }" v-show="existMoreMessages" @click="fetchMoreMessages" :disabled="fetchingMoreMessages">
				<template v-if="fetchingMoreMessages"><i class="fas fa-spinner fa-pulse fa-fw"></i></template>{{ fetchingMoreMessages ? $ts.loading : $ts.loadMore }}
			</button>
			<XList class="messages" :items="messages" v-slot="{ item: message }" direction="up" reversed>
				<XMessage :message="message" :is-group="group != null" :key="message.id"/>
			</XList>
		</div>
		<footer>
			<div class="typers" v-if="typers.length > 0">
				<I18n :src="$ts.typingUsers" text-tag="span" class="users">
					<template #users>
						<b v-for="user in typers" :key="user.id" class="user">{{ user.username }}</b>
					</template>
				</I18n>
				<MkEllipsis/>
			</div>
			<transition name="fade">
				<div class="new-message" v-show="showIndicator">
					<button class="_buttonPrimary" @click="onIndicatorClick"><i class="fas fa-arrow-circle-down"></i>{{ $ts.newMessageExists }}</button>
				</div>
			</transition>
			<XForm v-if="!fetching" :user="user" :group="group" ref="form"/>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XList from '@client/components/date-separated-list.vue';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import parseAcct from '@/misc/acct/parse';
import { isBottom, onScrollBottom, scroll } from '@client/scripts/scroll';
import * as os from '@client/os';
import { popout } from '@client/scripts/popout';
import * as sound from '@client/scripts/sound';
import * as symbols from '@client/symbols';

const Component = defineComponent({
	components: {
		XMessage,
		XForm,
		XList,
	},

	inject: ['inWindow'],

	props: {
		userAcct: {
			type: String,
			required: false,
		},
		groupId: {
			type: String,
			required: false,
		},
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => !this.fetching ? this.user ? {
				userName: this.user,
				avatar: this.user,
				action: {
					icon: 'fas fa-ellipsis-h',
					handler: this.menu,
				},
			} : {
				title: this.group.name,
				icon: 'fas fa-users',
				action: {
					icon: 'fas fa-ellipsis-h',
					handler: this.menu,
				},
			} : null),
			fetching: true,
			user: null,
			group: null,
			fetchingMoreMessages: false,
			messages: [],
			existMoreMessages: false,
			connection: null,
			showIndicator: false,
			timer: null,
			typers: [],
			ilObserver: new IntersectionObserver(
				(entries) => entries.some((entry) => entry.isIntersecting)
					&& !this.fetching
					&& !this.fetchingMoreMessages
					&& this.existMoreMessages
					&& this.fetchMoreMessages()
			),
		};
	},

	computed: {
		form(): any {
			return this.$refs.form;
		}
	},

	watch: {
		userAcct: 'fetch',
		groupId: 'fetch',
	},

	mounted() {
		this.fetch();
		if (this.$store.state.enableInfiniteScroll) {
			this.$nextTick(() => this.ilObserver.observe(this.$refs.loadMore as Element));
		}
	},

	beforeUnmount() {
		this.connection.dispose();

		document.removeEventListener('visibilitychange', this.onVisibilitychange);

		this.ilObserver.disconnect();
	},

	methods: {
		async fetch() {
			this.fetching = true;
			if (this.userAcct) {
				const user = await os.api('users/show', parseAcct(this.userAcct));
				this.user = user;
			} else {
				const group = await os.api('users/groups/show', { groupId: this.groupId });
				this.group = group;
			}

			this.connection = os.stream.connectToChannel('messaging', {
				otherparty: this.user ? this.user.id : undefined,
				group: this.group ? this.group.id : undefined,
			});

			this.connection.on('message', this.onMessage);
			this.connection.on('read', this.onRead);
			this.connection.on('deleted', this.onDeleted);
			this.connection.on('typers', typers => {
				this.typers = typers.filter(u => u.id !== this.$i.id);
			});

			document.addEventListener('visibilitychange', this.onVisibilitychange);

			this.fetchMessages().then(() => {
				this.scrollToBottom();

				// もっと見るの交差検知を発火させないためにfetchは
				// スクロールが終わるまでfalseにしておく
				// scrollendのようなイベントはないのでsetTimeoutで
				setTimeout(() => this.fetching = false, 300);
			});
		},

		onDragover(e) {
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;

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
				os.dialog({
					type: 'error',
					text: this.$ts.onlyOneFileCanBeAttached
				});
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.form.file = file;
			}
			//#endregion
		},

		fetchMessages() {
			return new Promise((resolve, reject) => {
				const max = this.existMoreMessages ? 20 : 10;

				os.api('messaging/messages', {
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
			sound.play('chat');

			const _isBottom = isBottom(this.$el, 64);

			this.messages.push(message);
			if (message.userId != this.$i.id && !document.hidden) {
				this.connection.send('read', {
					id: message.id
				});
			}

			if (_isBottom) {
				// Scroll to bottom
				this.$nextTick(() => {
					this.scrollToBottom();
				});
			} else if (message.userId != this.$i.id) {
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
						this.messages[exist] = {
							...this.messages[exist],
							isRead: true,
						};
					}
				}
			} else if (this.group) {
				for (const id of x.ids) {
					if (this.messages.some(x => x.id == id)) {
						const exist = this.messages.map(x => x.id).indexOf(id);
						this.messages[exist] = {
							...this.messages[exist],
							reads: [...this.messages[exist].reads, x.userId]
						};
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

		scrollToBottom() {
			scroll(this.$el, this.$el.offsetHeight);
		},

		onIndicatorClick() {
			this.showIndicator = false;
			this.scrollToBottom();
		},

		notifyNewMessage() {
			this.showIndicator = true;

			onScrollBottom(this.$el, () => {
				this.showIndicator = false;
			});

			if (this.timer) clearTimeout(this.timer);

			this.timer = setTimeout(() => {
				this.showIndicator = false;
			}, 4000);
		},

		onVisibilitychange() {
			if (document.hidden) return;
			for (const message of this.messages) {
				if (message.userId !== this.$i.id && !message.isRead) {
					this.connection.send('read', {
						id: message.id
					});
				}
			}
		},

		menu(ev) {
			const path = this.groupId ? `/my/messaging/group/${this.groupId}` : `/my/messaging/${this.userAcct}`;

			os.modalMenu([this.inWindow ? undefined : {
				text: this.$ts.openInWindow,
				icon: 'fas fa-window-maximize',
				action: () => {
					os.pageWindow(path);
					this.$router.back();
				},
			}, this.inWindow ? undefined : {
				text: this.$ts.popout,
				icon: 'fas fa-external-link-alt',
				action: () => {
					popout(path);
					this.$router.back();
				},
			}], ev.currentTarget || ev.target);
		}
	}
});

export default Component;
</script>

<style lang="scss" scoped>
.mk-messaging-room {
	> .body {
		> .empty {
			width: 100%;
			margin: 0;
			padding: 16px 8px 8px 8px;
			text-align: center;
			font-size: 0.8em;
			opacity: 0.5;

			i {
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

			i {
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

			> i {
				margin-right: 4px;
			}
		}

		> .messages {
			> ::v-deep(*) {
				margin-bottom: 16px;
			}
		}
	}

	> footer {
		width: 100%;
		position: relative;

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

		> .typers {
			position: absolute;
			bottom: 100%;
			padding: 0 8px 0 8px;
			font-size: 0.9em;
			color: var(--fgTransparentWeak);

			> .users {
				> .user + .user:before {
					content: ", ";
					font-weight: normal;
				}

				> .user:last-of-type:after {
					content: " ";
				}
			}
		}
	}
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
