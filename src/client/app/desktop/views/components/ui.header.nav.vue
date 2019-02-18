<template>
<div class="nav">
	<ul>
		<li class="timeline" :class="{ active: $route.name == 'index' }" @click="goToTop">
			<router-link to="/"><fa icon="home"/><p>{{ $t('@.timeline') }}</p></router-link>
		</li>
		<li class="featured" :class="{ active: $route.name == 'featured' }">
			<router-link to="/featured"><fa :icon="faNewspaper"/><p>{{ $t('@.featured-notes') }}</p></router-link>
		</li>
		<li class="explore" :class="{ active: $route.name == 'explore' || $route.name == 'explore-tag' }">
			<router-link to="/explore"><fa :icon="faHashtag"/><p>{{ $t('@.explore') }}</p></router-link>
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
import MkGameWindow from './game-window.vue';
import { faNewspaper, faHashtag } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.nav.vue'),
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			faNewspaper, faHashtag
		};
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
		onReversiInvited() {
			this.hasGameInvitations = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitations = false;
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
				padding 0 20px
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
