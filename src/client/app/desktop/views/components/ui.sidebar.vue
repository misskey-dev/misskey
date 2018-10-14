<template>
<div class="header" :class="$store.state.device.navbar">
	<div class="post">
		<button @click="post" title="%i18n:@post%">%fa:pencil-alt%</button>
	</div>

	<div class="nav" v-if="$store.getters.isSignedIn">
		<div class="home" :class="{ active: $route.name == 'index' }" @click="goToTop">
			<router-link to="/">%fa:home%</router-link>
		</div>
		<div class="deck" :class="{ active: $route.name == 'deck' }" @click="goToTop">
			<router-link to="/deck">%fa:columns%</router-link>
		</div>
		<div class="messaging">
			<a @click="messaging">%fa:comments%<template v-if="hasUnreadMessagingMessage">%fa:circle%</template></a>
		</div>
		<div class="game">
			<a @click="game">%fa:gamepad%<template v-if="hasGameInvitations">%fa:circle%</template></a>
		</div>
	</div>

	<div class="nav bottom" v-if="$store.getters.isSignedIn">
		<div>
			<a @click="drive">%fa:cloud%</a>
		</div>
		<div ref="notificationsButton" :class="{ active: showNotifications }" style="z-index:1;">
			<a @click="notifications">%fa:R bell%</a>
		</div>
		<div>
			<a @click="settings">%fa:cog%</a>
		</div>
	</div>

	<div class="account">
		<router-link :to="`/@${ $store.state.i.username }`">
			<mk-avatar class="avatar" :user="$store.state.i"/>
		</router-link>

		<div class="nav menu">
			<div class="signout">
				<a @click="signout">%fa:power-off%</a>
			</div>
			<div>
				<router-link to="/i/favorites">%fa:star%</router-link>
			</div>
			<div v-if="($store.state.i.isLocked || $store.state.i.carefulBot)">
				<a @click="followRequests">%fa:envelope R%<i v-if="$store.state.i.pendingReceivedFollowRequestsCount">{{ $store.state.i.pendingReceivedFollowRequestsCount }}</i></a>
			</div>
		</div>
	</div>

	<div class="nav dark">
		<div>
			<a @click="dark"><template v-if="$store.state.device.darkmode">%fa:moon%</template><template v-else>%fa:R moon%</template></a>
		</div>
	</div>

	<transition name="slide">
		<div class="notifications" v-if="showNotifications" ref="notifications">
			<mk-notifications/>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkUserListsWindow from './user-lists-window.vue';
import MkFollowRequestsWindow from './received-follow-requests-window.vue';
import MkSettingsWindow from './settings-window.vue';
import MkDriveWindow from './drive-window.vue';
import MkMessagingWindow from './messaging-window.vue';
import MkGameWindow from './game-window.vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			showNotifications: false
		};
	},

	computed: {
		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
	},

	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = (this as any).os.stream.useSharedConnection('main');

			this.connection.on('reversiInvited', this.onReversiInvited);
			this.connection.on('reversi_no_invites', this.onReversiNoInvites);
		}
	},

	beforeDestroy() {
		if (this.$store.getters.isSignedIn) {
			this.connection.dispose();
		}
	},

	methods: {
		onReversiInvited() {
			this.hasGameInvitations = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitations = false;
		},

		messaging() {
			(this as any).os.new(MkMessagingWindow);
		},

		game() {
			(this as any).os.new(MkGameWindow);
		},

		post() {
			(this as any).apis.post();
		},

		drive() {
			(this as any).os.new(MkDriveWindow);
		},

		list() {
			const w = (this as any).os.new(MkUserListsWindow);
			w.$once('choosen', list => {
				this.$router.push(`i/lists/${ list.id }`);
			});
		},

		followRequests() {
			(this as any).os.new(MkFollowRequestsWindow);
		},

		settings() {
			(this as any).os.new(MkSettingsWindow);
		},

		signout() {
			(this as any).os.signout();
		},

		notifications() {
			this.showNotifications ? this.closeNotifications() : this.openNotifications();
		},

		openNotifications() {
			this.showNotifications = true;
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.addEventListener('mousedown', this.onMousedown);
			});
		},

		closeNotifications() {
			this.showNotifications = false;
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.removeEventListener('mousedown', this.onMousedown);
			});
		},

		onMousedown(e) {
			e.preventDefault();
			if (
				!contains(this.$refs.notifications, e.target) &&
				this.$refs.notifications != e.target &&
				!contains(this.$refs.notificationsButton, e.target) &&
				this.$refs.notificationsButton != e.target
			) {
				this.closeNotifications();
			}
			return false;
		},

		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		},

		goToTop() {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.header
	$width = 68px

	position fixed
	top 0
	z-index 1000
	width $width
	height 100%
	background var(--desktopHeaderBg)
	box-shadow var(--shadowRight)

	&.left
		left 0

	&.right
		right 0

	> .post
		width $width
		height $width
		padding 12px

		> button
			display inline-block
			margin 0
			padding 0
			height 100%
			width 100%
			font-size 1.2em
			font-weight normal
			text-decoration none
			color var(--primaryForeground)
			background var(--primary) !important
			outline none
			border none
			border-radius 100%
			transition background 0.1s ease
			cursor pointer

			*
				pointer-events none

			&:hover
				background var(--primaryLighten10) !important

			&:active
				background var(--primaryDarken10) !important
				transition background 0s ease

	.nav
		> *
			&.active
				box-shadow -4px 0 var(--primary) inset

			> *
				display block
				width $width
				line-height 52px
				text-align center
				font-size 18px
				color var(--desktopHeaderFg)

				&:hover
					background rgba(0, 0, 0, 0.05)
					color var(--desktopHeaderHoverFg)
					text-decoration none

				&:active
					background rgba(0, 0, 0, 0.1)

	> .nav.bottom
		position absolute
		bottom 128px
		left 0

	> .account
		position absolute
		bottom 64px
		left 0
		width $width
		height $width
		padding 14px

		> .menu
			display none
			position absolute
			bottom 64px
			left 0
			background var(--desktopHeaderBg)

		&:hover
			> .menu
				display block

		> *:not(.menu)
			display block
			width 100%
			height 100%

			> .avatar
				pointer-events none
				width 100%
				height 100%

	> .dark
		position absolute
		bottom 0
		left 0
		width $width
		height $width

	> .notifications
		position fixed
		top 0
		left $width
		width 350px
		height 100%
		overflow auto
		background var(--face)
		box-shadow var(--shadowRight)

.slide-enter-active,
.slide-leave-active {
	transition: all 0.2s ease;
}

.slide-enter, .slide-leave-to {
	transform: translateX(-16px);
	opacity: 0;
}
</style>
