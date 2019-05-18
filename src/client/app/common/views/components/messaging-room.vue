<template>
<div class="mk-messaging-room"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
>
	<div class="body">
		<p class="init" v-if="init"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}</p>
		<p class="empty" v-if="!init && messages.length == 0"><fa icon="info-circle"/>{{ user ? $t('not-talked-user') : $t('not-talked-group') }}</p>
		<p class="no-history" v-if="!init && messages.length > 0 && !existMoreMessages"><fa :icon="faFlag"/>{{ $t('no-history') }}</p>
		<button class="more" :class="{ fetching: fetchingMoreMessages }" v-if="existMoreMessages" @click="fetchMoreMessages" :disabled="fetchingMoreMessages">
			<template v-if="fetchingMoreMessages"><fa icon="spinner" pulse fixed-width/></template>{{ fetchingMoreMessages ? $t('@.loading') : $t('@.load-more') }}
		</button>
		<template v-for="(message, i) in _messages">
			<x-message :message="message" :key="message.id" :is-group="group != null"/>
			<p class="date" v-if="i != messages.length - 1 && message._date != _messages[i + 1]._date">
				<span>{{ _messages[i + 1]._datetext }}</span>
			</p>
		</template>
	</div>
	<footer>
		<transition name="fade">
			<div class="new-message" v-show="showIndicator">
				<button @click="onIndicatorClick"><i><fa :icon="faArrowCircleDown"/></i>{{ $t('new-message') }}</button>
			</div>
		</transition>
		<x-form :user="user" :group="group" ref="form"/>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import { url } from '../../../config';
import { faArrowCircleDown, faFlag } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/messaging-room.vue'),

	components: {
		XMessage,
		XForm
	},

	props: {
		user: {
			type: Object,
			requird: false,
		},
		group: {
			type: Object,
			requird: false,
		},
		isNaked: {
			type: Boolean,
			requird: false,
		},
	},

	data() {
		return {
			init: true,
			fetchingMoreMessages: false,
			messages: [],
			existMoreMessages: false,
			connection: null,
			showIndicator: false,
			timer: null,
			faArrowCircleDown, faFlag
		};
	},

	computed: {
		_messages(): any[] {
			return (this.messages as any).map(message => {
				const date = new Date(message.createdAt).getDate();
				const month = new Date(message.createdAt).getMonth() + 1;
				message._date = date;
				message._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
				return message;
			});
		},

		form(): any {
			return this.$refs.form;
		}
	},

	mounted() {
		this.connection = this.$root.stream.connectToChannel('messaging', {
			otherparty: this.user ? this.user.id : undefined,
			group: this.group ? this.group.id : undefined,
		});

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);
		this.connection.on('deleted', this.onDeleted);

		if (this.isNaked) {
			window.addEventListener('scroll', this.onScroll, { passive: true });
		} else {
			this.$el.addEventListener('scroll', this.onScroll, { passive: true });
		}

		document.addEventListener('visibilitychange', this.onVisibilitychange);

		this.fetchMessages().then(() => {
			this.init = false;
			this.scrollToBottom();
		});
	},

	beforeDestroy() {
		this.connection.dispose();

		if (this.isNaked) {
			window.removeEventListener('scroll', this.onScroll);
		} else {
			this.$el.removeEventListener('scroll', this.onScroll);
		}

		document.removeEventListener('visibilitychange', this.onVisibilitychange);
	},

	methods: {
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
					text: this.$t('only-one-file-attached')
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
			// サウンドを再生する
			if (this.$store.state.device.enableSounds) {
				const sound = new Audio(`${url}/assets/message.mp3`);
				sound.volume = this.$store.state.device.soundVolume;
				sound.play();
			}

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
			if (this.isNaked) {
				window.scroll(0, document.body.offsetHeight);
			} else {
				this.$el.scrollTop = this.$el.scrollHeight;
			}
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

<style lang="stylus" scoped>
.mk-messaging-room
	display flex
	flex 1
	flex-direction column
	height 100%
	background var(--messagingRoomBg)

	> .body
		width 100%
		max-width 600px
		margin 0 auto
		flex 1

		> .init,
		> .empty
			width 100%
			margin 0
			padding 16px 8px 8px 8px
			text-align center
			font-size 0.8em
			color var(--messagingRoomInfo)
			opacity 0.5

			[data-icon]
				margin-right 4px

		> .no-history
			display block
			margin 0
			padding 16px
			text-align center
			font-size 0.8em
			color var(--messagingRoomInfo)
			opacity 0.5

			[data-icon]
				margin-right 4px

		> .more
			display block
			margin 16px auto
			padding 0 12px
			line-height 24px
			color #fff
			background rgba(#000, 0.3)
			border-radius 12px

			&:hover
				background rgba(#000, 0.4)

			&:active
				background rgba(#000, 0.5)

			&.fetching
				cursor wait

			> [data-icon]
				margin-right 4px

		> .message
			// something

		> .date
			display block
			margin 8px 0
			text-align center

			&:before
				content ''
				display block
				position absolute
				height 1px
				width 90%
				top 16px
				left 0
				right 0
				margin 0 auto
				background var(--messagingRoomDateDividerLine)

			> span
				display inline-block
				margin 0
				padding 0 16px
				//font-weight bold
				line-height 32px
				color var(--messagingRoomDateDividerText)
				background var(--messagingRoomBg)

	> footer
		position -webkit-sticky
		position sticky
		z-index 2
		bottom 0
		width 100%
		max-width 600px
		margin 0 auto
		padding 0
		background var(--messagingRoomBg)
		background-clip content-box

		> .new-message
			position absolute
			top -48px
			width 100%
			padding 8px 0
			text-align center

			> button
				display inline-block
				margin 0
				padding 0 12px 0 30px
				cursor pointer
				line-height 32px
				font-size 12px
				color var(--primaryForeground)
				background var(--primary)
				border-radius 16px

				&:hover
					background var(--primaryLighten10)

				&:active
					background var(--primaryDarken10)

				> i
					position absolute
					top 0
					left 10px
					line-height 32px
					font-size 16px

.fade-enter-active, .fade-leave-active
	transition opacity 0.1s

.fade-enter, .fade-leave-to
	transition opacity 0.5s
	opacity 0

</style>
