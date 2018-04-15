<template>
<div class="mk-messaging-room"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
>
	<div class="stream">
		<p class="init" v-if="init">%fa:spinner .spin%%i18n:common.loading%</p>
		<p class="empty" v-if="!init && messages.length == 0">%fa:info-circle%%i18n:@empty%</p>
		<p class="no-history" v-if="!init && messages.length > 0 && !existMoreMessages">%fa:flag%%i18n:@no-history%</p>
		<button class="more" :class="{ fetching: fetchingMoreMessages }" v-if="existMoreMessages" @click="fetchMoreMessages" :disabled="fetchingMoreMessages">
			<template v-if="fetchingMoreMessages">%fa:spinner .pulse .fw%</template>{{ fetchingMoreMessages ? '%i18n:common.loading%' : '%i18n:@more%' }}
		</button>
		<template v-for="(message, i) in _messages">
			<x-message :message="message" :key="message.id"/>
			<p class="date" v-if="i != messages.length - 1 && message._date != _messages[i + 1]._date">
				<span>{{ _messages[i + 1]._datetext }}</span>
			</p>
		</template>
	</div>
	<footer>
		<div ref="notifications" class="notifications"></div>
		<x-form :user="user" ref="form"/>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagingStream } from '../../scripts/streaming/messaging';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import { url } from '../../../config';

export default Vue.extend({
	components: {
		XMessage,
		XForm
	},

	props: ['user', 'isNaked'],

	data() {
		return {
			init: true,
			fetchingMoreMessages: false,
			messages: [],
			existMoreMessages: false,
			connection: null
		};
	},

	computed: {
		_messages(): any[] {
			return (this.messages as any).map(message => {
				const date = new Date(message.createdAt).getDate();
				const month = new Date(message.createdAt).getMonth() + 1;
				message._date = date;
				message._datetext = `${month}月 ${date}日`;
				return message;
			});
		},

		form(): any {
			return this.$refs.form;
		}
	},

	mounted() {
		this.connection = new MessagingStream((this as any).os, (this as any).os.i, this.user.id);

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		document.addEventListener('visibilitychange', this.onVisibilitychange);

		this.fetchMessages().then(() => {
			this.init = false;
			this.scrollToBottom();
		});
	},

	beforeDestroy() {
		this.connection.off('message', this.onMessage);
		this.connection.off('read', this.onRead);
		this.connection.close();

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
				alert('メッセージに添付できるのはひとつのファイルのみです');
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

				(this as any).api('messaging/messages', {
					userId: this.user.id,
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
			if ((this as any).os.isEnableSounds) {
				const sound = new Audio(`${url}/assets/message.mp3`);
				sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 0.5;
				sound.play();
			}

			const isBottom = this.isBottom();

			this.messages.push(message);
			if (message.userId != (this as any).os.i.id && !document.hidden) {
				this.connection.send({
					type: 'read',
					id: message.id
				});
			}

			if (isBottom) {
				// Scroll to bottom
				this.$nextTick(() => {
					this.scrollToBottom();
				});
			} else if (message.userId != (this as any).os.i.id) {
				// Notify
				this.notify('%i18n:@new-message%');
			}
		},

		onRead(ids) {
			if (!Array.isArray(ids)) ids = [ids];
			ids.forEach(id => {
				if (this.messages.some(x => x.id == id)) {
					const exist = this.messages.map(x => x.id).indexOf(id);
					this.messages[exist].isRead = true;
				}
			});
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

		notify(message) {
			const n = document.createElement('p') as any;
			n.innerHTML = '%fa:arrow-circle-down%' + message;
			n.onclick = () => {
				this.scrollToBottom();
				n.parentNode.removeChild(n);
			};
			(this.$refs.notifications as any).appendChild(n);

			setTimeout(() => {
				n.style.opacity = 0;
				setTimeout(() => n.parentNode.removeChild(n), 1000);
			}, 4000);
		},

		onVisibilitychange() {
			if (document.hidden) return;
			this.messages.forEach(message => {
				if (message.userId !== (this as any).os.i.id && !message.isRead) {
					this.connection.send({
						type: 'read',
						id: message.id
					});
				}
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-messaging-room
	display flex
	flex 1
	flex-direction column
	height 100%

	> .stream
		width 100%
		max-width 600px
		margin 0 auto
		flex 1

		> .init
			width 100%
			margin 0
			padding 16px 8px 8px 8px
			text-align center
			font-size 0.8em
			color rgba(0, 0, 0, 0.4)

			[data-fa]
				margin-right 4px

		> .empty
			width 100%
			margin 0
			padding 16px 8px 8px 8px
			text-align center
			font-size 0.8em
			color rgba(0, 0, 0, 0.4)

			[data-fa]
				margin-right 4px

		> .no-history
			display block
			margin 0
			padding 16px
			text-align center
			font-size 0.8em
			color rgba(0, 0, 0, 0.4)

			[data-fa]
				margin-right 4px

		> .more
			display block
			margin 16px auto
			padding 0 12px
			line-height 24px
			color #fff
			background rgba(0, 0, 0, 0.3)
			border-radius 12px

			&:hover
				background rgba(0, 0, 0, 0.4)

			&:active
				background rgba(0, 0, 0, 0.5)

			&.fetching
				cursor wait

			> [data-fa]
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
				background rgba(0, 0, 0, 0.1)

			> span
				display inline-block
				margin 0
				padding 0 16px
				//font-weight bold
				line-height 32px
				color rgba(0, 0, 0, 0.3)
				background #fff

	> footer
		position -webkit-sticky
		position sticky
		z-index 2
		bottom 0
		width 100%
		max-width 600px
		margin 0 auto
		padding 0
		background rgba(255, 255, 255, 0.95)
		background-clip content-box

		> .notifications
			position absolute
			top -48px
			width 100%
			padding 8px 0
			text-align center

			&:empty
				display none

			> p
				display inline-block
				margin 0
				padding 0 12px 0 28px
				cursor pointer
				line-height 32px
				font-size 12px
				color $theme-color-foreground
				background $theme-color
				border-radius 16px
				transition opacity 1s ease

				> [data-fa]
					position absolute
					top 0
					left 10px
					line-height 32px
					font-size 16px

</style>
