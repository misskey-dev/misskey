<template>
<div class="header" :class="navbar" :data-shadow="$store.state.device.useShadow">
	<div class="body">
		<div class="post">
			<button @click="post" :title="$t('title')"><fa icon="pencil-alt"/></button>
		</div>

		<div class="nav" v-if="$store.getters.isSignedIn">
			<div class="home" :class="{ active: $route.name == 'index' }" @click="goToTop">
				<router-link to="/"><fa icon="home"/></router-link>
			</div>
			<div class="featured" :class="{ active: $route.name == 'featured' }">
				<router-link to="/featured"><fa :icon="faNewspaper"/></router-link>
			</div>
			<div class="explore" :class="{ active: $route.name == 'explore' || $route.name == 'explore-tag' }">
				<router-link to="/explore"><fa :icon="faHashtag"/></router-link>
			</div>
			<div class="game">
				<a @click="game"><fa icon="gamepad"/><template v-if="hasGameInvitations"><fa icon="circle"/></template></a>
			</div>
		</div>

		<div class="nav bottom" v-if="$store.getters.isSignedIn">
			<div :title="$t('@.search')">
				<a @click="search"><fa icon="search"/></a>
			</div>
			<div :title="$t('@.drive')">
				<a @click="drive"><fa icon="cloud"/></a>
			</div>
			<div ref="notificationsButton" :class="{ active: showNotifications }">
				<a @click="notifications"><fa :icon="['far', 'bell']"/></a>
			</div>
			<div class="messaging">
				<a @click="messaging"><fa icon="comments"/><template v-if="hasUnreadMessagingMessage"><fa icon="circle"/></template></a>
			</div>
			<div>
				<a @click="settings"><fa icon="cog"/></a>
			</div>
			<div class="signout">
				<a @click="signout"><fa icon="power-off"/></a>
			</div>
			<div>
				<router-link to="/i/favorites"><fa icon="star"/></router-link>
			</div>
			<div v-if="($store.state.i.isLocked || $store.state.i.carefulBot)">
				<a @click="followRequests"><fa :icon="['far', 'envelope']"/><i v-if="$store.state.i.pendingReceivedFollowRequestsCount">{{ $store.state.i.pendingReceivedFollowRequestsCount }}</i></a>
			</div>
			<div class="account">
				<router-link :to="`/@${ $store.state.i.username }`">
					<mk-avatar class="avatar" :user="$store.state.i"/>
				</router-link>
			</div>
			<div>
				<template v-if="$store.state.device.inDeckMode">
					<a @click="toggleDeckMode(false)"><fa icon="home"/></a>
				</template>
				<template v-else>
					<a @click="toggleDeckMode(true)"><fa icon="columns"/></a>
				</template>
			</div>
			<div>
				<a @click="dark"><template v-if="$store.state.device.darkmode"><fa icon="moon"/></template><template v-else><fa :icon="['far', 'moon']"/></template></a>
			</div>
		</div>
	</div>

	<transition :name="`slide-${navbar}`">
		<div class="notifications" v-if="showNotifications" ref="notifications" :class="navbar" :data-shadow="$store.state.device.useShadow">
			<mk-notifications/>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkDriveWindow from './drive-window.vue';
import MkMessagingWindow from './messaging-window.vue';
import MkGameWindow from './game-window.vue';
import contains from '../../../common/scripts/contains';
import { faNewspaper, faHashtag } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.sidebar.vue'),
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			showNotifications: false,
			searching: false,
			faNewspaper, faHashtag
		};
	},

	computed: {
		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		},

		navbar(): string {
			return this.$store.state.device.navbar;
		},
	},

	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');

			this.connection.on('reversiInvited', this.onReversiInvited);
			this.connection.on('reversiNoInvites', this.onReversiNoInvites);
		}
	},

	beforeDestroy() {
		if (this.$store.getters.isSignedIn) {
			this.connection.dispose();
		}
	},

	methods: {
		toggleDeckMode(deck) {
			this.$store.commit('device/set', { key: 'deckMode', value: deck });
			location.replace('/');
		},

		onReversiInvited() {
			this.hasGameInvitations = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitations = false;
		},

		messaging() {
			this.$root.new(MkMessagingWindow);
		},

		game() {
			this.$root.new(MkGameWindow);
		},

		post() {
			this.$post();
		},

		search() {
			if (this.searching) return;

			this.$root.dialog({
				title: this.$t('@.search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled) return;

				const q = query.trim();
				if (q.startsWith('@')) {
					this.$router.push(`/${q}`);
				} else if (q.startsWith('#')) {
					this.$router.push(`/tags/${encodeURIComponent(q.substr(1))}`);
				} else if (q.startsWith('https://')) {
					this.searching = true;
					try {
						const res = await this.$root.api('ap/show', {
							uri: q
						});
						if (res.type == 'User') {
							this.$router.push(`/@${res.object.username}@${res.object.host}`);
						} else if (res.type == 'Note') {
							this.$router.push(`/notes/${res.object.id}`);
						}
					} catch (e) {
						// TODO
					}
					this.searching = false;
				} else {
					this.$router.push(`/search?q=${encodeURIComponent(q)}`);
				}
			});
		},

		drive() {
			this.$root.new(MkDriveWindow);
		},

		list() {
			this.$root.new(MkUserListsWindow);
		},

		followRequests() {
			this.$root.new(MkFollowRequestsWindow);
		},

		settings() {
			this.$router.push(`/i/settings`);
		},

		signout() {
			this.$root.signout();
		},

		notifications() {
			this.showNotifications ? this.closeNotifications() : this.openNotifications();
		},

		openNotifications() {
			this.showNotifications = true;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.addEventListener('mousedown', this.onMousedown);
			}
		},

		closeNotifications() {
			this.showNotifications = false;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.removeEventListener('mousedown', this.onMousedown);
			}
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

	&.left
		left 0

		&[data-shadow]
			box-shadow 4px 0 4px rgba(0, 0, 0, 0.1)

	&.right
		right 0

		&[data-shadow]
			box-shadow -4px 0 4px rgba(0, 0, 0, 0.1)

	> .body
		position fixed
		top 0
		z-index 1
		width $width
		height 100%
		background var(--desktopHeaderBg)

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

		> .nav.bottom
			position absolute
			bottom 0
			left 0

			> .account
				width $width
				height $width
				padding 14px

				> *
					display block
					width 100%
					height 100%

					> .avatar
						pointer-events none
						width 100%
						height 100%

	> .notifications
		position fixed
		top 0
		width 350px
		height 100%
		overflow auto
		background var(--face)

		&.left
			left $width

			&[data-shadow]
				box-shadow 4px 0 4px rgba(0, 0, 0, 0.1)

		&.right
			right $width

			&[data-shadow]
				box-shadow -4px 0 4px rgba(0, 0, 0, 0.1)

	.nav
		> *
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

	&.left
		.nav
			> *
				&.active
					box-shadow -4px 0 var(--primary) inset

	&.right
		.nav
			> *
				&.active
					box-shadow 4px 0 var(--primary) inset

.slide-left-enter-active,
.slide-left-leave-active {
	transition: all 0.2s ease;
}

.slide-left-enter, .slide-left-leave-to {
	transform: translateX(-16px);
	opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
	transition: all 0.2s ease;
}

.slide-right-enter, .slide-right-leave-to {
	transform: translateX(16px);
	opacity: 0;
}
</style>
