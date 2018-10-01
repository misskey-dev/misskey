<template>
<div class="nav">
	<ul>
		<template v-if="$store.getters.isSignedIn">
			<li class="home" :class="{ active: $route.name == 'index' }" @click="goToTop">
				<router-link to="/">
					%fa:home%
					<p>%i18n:@home%</p>
				</router-link>
			</li>
			<li class="deck" :class="{ active: $route.name == 'deck' }" @click="goToTop">
				<router-link to="/deck">
					%fa:columns%
					<p>%i18n:@deck%</p>
				</router-link>
			</li>
			<li class="messaging">
				<a @click="messaging">
					%fa:comments%
					<p>%i18n:@messaging%</p>
					<template v-if="hasUnreadMessagingMessage">%fa:circle%</template>
				</a>
			</li>
			<li class="game">
				<a @click="game">
					%fa:gamepad%
					<p>%i18n:@game%</p>
					<template v-if="hasGameInvitations">%fa:circle%</template>
				</a>
			</li>
		</template>
	</ul>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMessagingWindow from './messaging-window.vue';
import MkGameWindow from './game-window.vue';

export default Vue.extend({
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			connectionId: null
		};
	},
	computed: {
		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
	},
	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();

			this.connection.on('reversi_invited', this.onReversiInvited);
			this.connection.on('reversi_no_invites', this.onReversiNoInvites);
		}
	},
	beforeDestroy() {
		if (this.$store.getters.isSignedIn) {
			this.connection.off('reversi_invited', this.onReversiInvited);
			this.connection.off('reversi_no_invites', this.onReversiNoInvites);
			(this as any).os.stream.dispose(this.connectionId);
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
					border-bottom solid 3px var(--primary)

			> a
				display inline-block
				z-index 1
				height 100%
				padding 0 24px
				font-size 13px
				font-variant small-caps
				color var(--desktopHeaderFg)
				text-decoration none
				transition none
				cursor pointer

				*
					pointer-events none

				&:hover
					color var(--desktopHeaderHoverFg)
					text-decoration none

				> [data-fa]:first-child
					margin-right 8px

				> [data-fa]:last-child
					margin-left 5px
					font-size 10px
					color var(--primary)

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
