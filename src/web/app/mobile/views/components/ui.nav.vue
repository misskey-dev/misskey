<template>
<div class="nav">
	<transition name="back">
		<div class="backdrop"
			v-if="isOpen"
			@click="$parent.isDrawerOpening = false"
			@touchstart="$parent.isDrawerOpening = false"
		></div>
	</transition>
	<transition name="nav">
		<div class="body" v-if="isOpen">
			<router-link class="me" v-if="os.isSignedIn" :to="`/${os.i.username}`">
				<img class="avatar" :src="`${os.i.avatar_url}?thumbnail&size=128`" alt="avatar"/>
				<p class="name">{{ os.i.name }}</p>
			</router-link>
			<div class="links">
				<ul>
					<li><router-link to="/">%fa:home%%i18n:mobile.tags.mk-ui-nav.home%%fa:angle-right%</router-link></li>
					<li><router-link to="/i/notifications">%fa:R bell%%i18n:mobile.tags.mk-ui-nav.notifications%<template v-if="hasUnreadNotifications">%fa:circle%</template>%fa:angle-right%</router-link></li>
					<li><router-link to="/i/messaging">%fa:R comments%%i18n:mobile.tags.mk-ui-nav.messaging%<template v-if="hasUnreadMessagingMessages">%fa:circle%</template>%fa:angle-right%</router-link></li>
					<li><router-link to="/game/othello">%fa:gamepad%ゲーム%fa:angle-right%</router-link></li>
				</ul>
				<ul>
					<li><a :href="chUrl" target="_blank">%fa:tv%%i18n:mobile.tags.mk-ui-nav.ch%%fa:angle-right%</a></li>
					<li><router-link to="/i/drive">%fa:cloud%%i18n:mobile.tags.mk-ui-nav.drive%%fa:angle-right%</router-link></li>
				</ul>
				<ul>
					<li><a @click="search">%fa:search%%i18n:mobile.tags.mk-ui-nav.search%%fa:angle-right%</a></li>
				</ul>
				<ul>
					<li><router-link to="/i/settings">%fa:cog%%i18n:mobile.tags.mk-ui-nav.settings%%fa:angle-right%</router-link></li>
				</ul>
			</div>
			<a :href="aboutUrl"><p class="about">%i18n:mobile.tags.mk-ui-nav.about%</p></a>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { docsUrl, chUrl, lang } from '../../../config';

export default Vue.extend({
	props: ['isOpen'],
	data() {
		return {
			hasUnreadNotifications: false,
			hasUnreadMessagingMessages: false,
			connection: null,
			connectionId: null,
			aboutUrl: `${docsUrl}/${lang}/about`,
			chUrl
		};
	},
	mounted() {
		if ((this as any).os.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();

			this.connection.on('read_all_notifications', this.onReadAllNotifications);
			this.connection.on('unread_notification', this.onUnreadNotification);
			this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

			// Fetch count of unread notifications
			(this as any).api('notifications/get_unread_count').then(res => {
				if (res.count > 0) {
					this.hasUnreadNotifications = true;
				}
			});

			// Fetch count of unread messaging messages
			(this as any).api('messaging/unread').then(res => {
				if (res.count > 0) {
					this.hasUnreadMessagingMessages = true;
				}
			});
		}
	},
	beforeDestroy() {
		if ((this as any).os.isSignedIn) {
			this.connection.off('read_all_notifications', this.onReadAllNotifications);
			this.connection.off('unread_notification', this.onUnreadNotification);
			this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		search() {
			const query = window.prompt('%i18n:mobile.tags.mk-ui-nav.search%');
			if (query == null || query == '') return;
			this.$router.push('/search?q=' + encodeURIComponent(query));
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
@import '~const.styl'

.nav
	.backdrop
		position fixed
		top 0
		left 0
		z-index 1025
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.2)

	.body
		position fixed
		top 0
		left 0
		z-index 1026
		width 240px
		height 100%
		overflow auto
		-webkit-overflow-scrolling touch
		color #777
		background #fff

	.me
		display block
		margin 0
		padding 16px

		.avatar
			display inline
			max-width 64px
			border-radius 32px
			vertical-align middle

		.name
			display block
			margin 0 16px
			position absolute
			top 0
			left 80px
			padding 0
			width calc(100% - 112px)
			color #777
			line-height 96px
			overflow hidden
			text-overflow ellipsis
			white-space nowrap

	ul
		display block
		margin 16px 0
		padding 0
		list-style none

		&:first-child
			margin-top 0

		li
			display block
			font-size 1em
			line-height 1em

			a
				display block
				padding 0 20px
				line-height 3rem
				line-height calc(1rem + 30px)
				color #777
				text-decoration none

				> [data-fa]:first-child
					margin-right 0.5em

				> [data-fa].circle
					margin-left 6px
					font-size 10px
					color $theme-color

				> [data-fa]:last-child
					position absolute
					top 0
					right 0
					padding 0 20px
					font-size 1.2em
					line-height calc(1rem + 30px)
					color #ccc

	.about
		margin 0
		padding 1em 0
		text-align center
		font-size 0.8em
		opacity 0.5

		a
			color #777

.nav-enter-active,
.nav-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-enter,
.nav-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.back-enter-active,
.back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.back-enter,
.back-leave-active {
	opacity: 0;
}

</style>
