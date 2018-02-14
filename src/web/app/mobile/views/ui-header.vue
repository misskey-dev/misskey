<template>
<div class="mk-ui-header">
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="content">
			<button class="nav" @click="parent.toggleDrawer">%fa:bars%</button>
			<template v-if="hasUnreadNotifications || hasUnreadMessagingMessages">%fa:circle%</template>
			<h1 ref="title">Misskey</h1>
			<button v-if="func" @click="func"><mk-raw content={ funcIcon }/></button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			func: null,
			funcIcon: null,
			hasUnreadNotifications: false,
			hasUnreadMessagingMessages: false,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		if (this.$root.$data.os.isSignedIn) {
			this.connection = this.$root.$data.os.stream.getConnection();
			this.connectionId = this.$root.$data.os.stream.use();

			this.connection.on('read_all_notifications', this.onReadAllNotifications);
			this.connection.on('unread_notification', this.onUnreadNotification);
			this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

			// Fetch count of unread notifications
			this.$root.$data.os.api('notifications/get_unread_count').then(res => {
				if (res.count > 0) {
					this.hasUnreadNotifications = true;
				}
			});

			// Fetch count of unread messaging messages
			this.$root.$data.os.api('messaging/unread').then(res => {
				if (res.count > 0) {
					this.hasUnreadMessagingMessages = true;
				}
			});
		}
	},
	beforeDestroy() {
		if (this.$root.$data.os.isSignedIn) {
			this.connection.off('read_all_notifications', this.onReadAllNotifications);
			this.connection.off('unread_notification', this.onUnreadNotification);
			this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
			this.$root.$data.os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		setFunc(fn, icon) {
			this.func = fn;
			this.funcIcon = icon;
		},
		onReadAllNotifications() {
			this.hasUnreadNotifications = false;
		},
		onUnreadNotification() {
			this.hasUnreadNotifications = true;
		},
		onReadAllMessagingMessages() {
			this.hasUnreadMessagingMessages = false;
		},
		onUnreadMessagingMessage() {
			this.hasUnreadMessagingMessages = true;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui-header
	$height = 48px

	position fixed
	top 0
	z-index 1024
	width 100%
	box-shadow 0 1px 0 rgba(#000, 0.075)

	> .main
		color rgba(#fff, 0.9)

		> .backdrop
			position absolute
			top 0
			z-index 1023
			width 100%
			height $height
			-webkit-backdrop-filter blur(12px)
			backdrop-filter blur(12px)
			background-color rgba(#1b2023, 0.75)

		> .content
			z-index 1024

			> h1
				display block
				margin 0 auto
				padding 0
				width 100%
				max-width calc(100% - 112px)
				text-align center
				font-size 1.1em
				font-weight normal
				line-height $height
				white-space nowrap
				overflow hidden
				text-overflow ellipsis

				[data-fa]
					margin-right 8px

				> img
					display inline-block
					vertical-align bottom
					width ($height - 16px)
					height ($height - 16px)
					margin 8px
					border-radius 6px

			> .nav
				display block
				position absolute
				top 0
				left 0
				width $height
				font-size 1.4em
				line-height $height
				border-right solid 1px rgba(#000, 0.1)

				> [data-fa]
					transition all 0.2s ease

			> [data-fa].circle
				position absolute
				top 8px
				left 8px
				pointer-events none
				font-size 10px
				color $theme-color

			> button:last-child
				display block
				position absolute
				top 0
				right 0
				width $height
				text-align center
				font-size 1.4em
				color inherit
				line-height $height
				border-left solid 1px rgba(#000, 0.1)

</style>
