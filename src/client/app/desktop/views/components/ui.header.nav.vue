<template>
<div class="nav">
	<ul>
		<template v-if="$store.getters.isSignedIn">
			<template v-if="$store.state.device.deckMode">
				<li class="deck active" @click="goToTop">
					<router-link to="/"><fa icon="columns"/><p>{{ $t('deck') }}</p></router-link>
				</li>
				<li class="home">
					<a @click="toggleDeckMode(false)"><fa icon="home"/><p>{{ $t('home') }}</p></a>
				</li>
			</template>
			<template v-else>
				<li class="home active" @click="goToTop">
					<router-link to="/"><fa icon="home"/><p>{{ $t('home') }}</p></router-link>
				</li>
				<li class="deck">
					<a @click="toggleDeckMode(true)"><fa icon="columns"/><p>{{ $t('deck') }}</p></a>
				</li>
			</template>
			<li class="messaging">
				<a @click="messaging">
					<fa icon="comments"/>
					<p>{{ $t('@.messaging') }}</p>
					<template v-if="hasUnreadMessagingMessage"><fa icon="circle"/></template>
				</a>
			</li>
		</template>
		<li class="featured">
			<router-link to="/featured"><fa :icon="faNewspaper"/><p>{{ $t('@.featured-notes') }}</p></router-link>
		</li>
		<li class="game">
			<a @click="game">
				<fa icon="gamepad"/>
				<p>{{ $t('game') }}</p>
				<template v-if="hasGameInvitations"><fa icon="circle"/></template>
			</a>
		</li>
	</ul>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkMessagingWindow from './messaging-window.vue';
import MkGameWindow from './game-window.vue';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.nav.vue'),
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			faNewspaper
		};
	},
	computed: {
		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
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
			location.reload();
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

				> [data-icon]:first-child
					margin-right 8px

				> [data-icon]:last-child
					margin-left 5px
					font-size 10px
					color var(--notificationIndicator)

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
