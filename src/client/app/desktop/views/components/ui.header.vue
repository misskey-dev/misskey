<template>
<div class="header">
	<mk-special-message/>
	<div class="main" ref="main">
		<div class="backdrop"></div>
		<div class="main">
			<p ref="welcomeback" v-if="$store.getters.isSignedIn">おかえりなさい、<b>{{ $store.state.i | userName }}</b>さん</p>
			<div class="container" ref="mainContainer">
				<div class="left">
					<x-nav/>
				</div>
				<div class="right">
					<x-search/>
					<x-account v-if="$store.getters.isSignedIn"/>
					<x-notifications v-if="$store.getters.isSignedIn"/>
					<x-post v-if="$store.getters.isSignedIn"/>
					<x-clock/>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

import XNav from './ui.header.nav.vue';
import XSearch from './ui.header.search.vue';
import XAccount from './ui.header.account.vue';
import XNotifications from './ui.header.notifications.vue';
import XPost from './ui.header.post.vue';
import XClock from './ui.header.clock.vue';

export default Vue.extend({
	components: {
		XNav,
		XSearch,
		XAccount,
		XNotifications,
		XPost,
		XClock,
	},
	mounted() {
		this.$store.commit('setUiHeaderHeight', 48);

		if (this.$store.getters.isSignedIn) {
			const ago = (new Date().getTime() - new Date(this.$store.state.i.lastUsedAt).getTime()) / 1000;
			const isHisasiburi = ago >= 3600;
			this.$store.state.i.lastUsedAt = new Date();

			if (isHisasiburi) {
				(this.$refs.welcomeback as any).style.display = 'block';
				(this.$refs.main as any).style.overflow = 'hidden';

				anime({
					targets: this.$refs.welcomeback,
					top: '0',
					opacity: 1,
					delay: 1000,
					duration: 500,
					easing: 'easeOutQuad'
				});

				anime({
					targets: this.$refs.mainContainer,
					opacity: 0,
					delay: 1000,
					duration: 500,
					easing: 'easeOutQuad'
				});

				setTimeout(() => {
					anime({
						targets: this.$refs.welcomeback,
						top: '-48px',
						opacity: 0,
						duration: 500,
						complete: () => {
							(this.$refs.welcomeback as any).style.display = 'none';
							(this.$refs.main as any).style.overflow = 'initial';
						},
						easing: 'easeInQuad'
					});

					anime({
						targets: this.$refs.mainContainer,
						opacity: 1,
						duration: 500,
						easing: 'easeInQuad'
					});
				}, 2500);
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	position -webkit-sticky
	position sticky
	top 0
	z-index 1000
	width 100%
	box-shadow 0 1px 1px rgba(#000, 0.075)

	> .main
		height 48px

		> .backdrop
			position absolute
			top 0
			z-index 1000
			width 100%
			height 48px
			background isDark ? #313543 : #f7f7f7

		> .main
			z-index 1001
			margin 0
			padding 0
			background-clip content-box
			font-size 0.9rem
			user-select none

			> p
				display none
				position absolute
				top 48px
				width 100%
				line-height 48px
				margin 0
				text-align center
				color isDark ? #fff : #888
				opacity 0

			> .container
				display flex
				width 100%
				max-width 1300px
				margin 0 auto

				&:before
					content ""
					position absolute
					top 0
					left 0
					display block
					width 100%
					height 48px
					background-image isDark ? url('/assets/desktop/header-icon.dark.svg') : url('/assets/desktop/header-icon.light.svg')
					background-size 24px
					background-position center
					background-repeat no-repeat
					opacity 0.3

				> .left
					margin 0 auto 0 0
					height 48px

				> .right
					margin 0 0 0 auto
					height 48px

					> *
						display inline-block
						vertical-align top

					@media (max-width 1100px)
						> .mk-ui-header-search
							display none

.header[data-darkmode]
	root(true)

.header:not([data-darkmode])
	root(false)

</style>
