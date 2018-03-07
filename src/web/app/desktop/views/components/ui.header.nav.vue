<template>
<div class="nav">
	<ul>
		<template v-if="os.isSignedIn">
			<li class="home" :class="{ active: $route.name == 'index' }">
				<router-link to="/">
					%fa:home%
					<p>%i18n:desktop.tags.mk-ui-header-nav.home%</p>
				</router-link>
			</li>
			<li class="messaging">
				<a @click="messaging">
					%fa:comments%
					<p>%i18n:desktop.tags.mk-ui-header-nav.messaging%</p>
					<template v-if="hasUnreadMessagingMessages">%fa:circle%</template>
				</a>
			</li>
			<li class="game">
				<a @click="game">
					%fa:gamepad%
					<p>ゲーム</p>
					<template v-if="hasGameInvitations">%fa:circle%</template>
				</a>
			</li>
		</template>
		<li class="ch">
			<a :href="chUrl" target="_blank">
				%fa:tv%
				<p>%i18n:desktop.tags.mk-ui-header-nav.ch%</p>
			</a>
		</li>
	</ul>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { chUrl } from '../../../config';
import MkMessagingWindow from './messaging-window.vue';
import MkGameWindow from './game-window.vue';

export default Vue.extend({
	data() {
		return {
			hasUnreadMessagingMessages: false,
			hasGameInvitations: false,
			connection: null,
			connectionId: null,
			chUrl
		};
	},
	mounted() {
		if ((this as any).os.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();

			this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

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
			this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		onReadAllMessagingMessages() {
			this.hasUnreadMessagingMessages = false;
		},

		onUnreadMessagingMessage() {
			this.hasUnreadMessagingMessages = true;
		},

		messaging() {
			(this as any).os.new(MkMessagingWindow);
		},

		game() {
			(this as any).os.new(MkGameWindow);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.nav
	display inline-block
	margin 0
	padding 0
	line-height 3rem
	vertical-align top

	> ul
		display inline-block
		margin 0
		padding 0
		vertical-align top
		line-height 3rem
		list-style none

		> li
			display inline-block
			vertical-align top
			height 48px
			line-height 48px

			&.active
				> a
					border-bottom solid 3px $theme-color

			> a
				display inline-block
				z-index 1
				height 100%
				padding 0 24px
				font-size 13px
				font-variant small-caps
				color #9eaba8
				text-decoration none
				transition none
				cursor pointer

				*
					pointer-events none

				&:hover
					color darken(#9eaba8, 20%)
					text-decoration none

				> [data-fa]:first-child
					margin-right 8px

				> [data-fa]:last-child
					margin-left 5px
					font-size 10px
					color $theme-color

					@media (max-width 1100px)
						margin-left -5px

				> p
					display inline
					margin 0

					@media (max-width 1100px)
						display none

				@media (max-width 700px)
					padding 0 12px

</style>
