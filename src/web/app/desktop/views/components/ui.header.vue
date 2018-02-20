<template>
<div class="header">
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="main">
			<div class="container">
				<div class="left">
					<x-nav/>
				</div>
				<div class="right">
					<x-search/>
					<x-account v-if="os.isSignedIn"/>
					<x-notifications v-if="os.isSignedIn"/>
					<x-post v-if="os.isSignedIn"/>
					<x-clock/>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

import XNav from './ui.header.nav.vue';
import XSearch from './ui.header.search.vue';
import XAccount from './ui.header.account.vue';
import XNotifications from './ui.header.notifications.vue';
import XPost from './ui.header.post.vue';
import XClock from './ui.header.clock.vue';

export default Vue.extend({
	components: {
		'x-nav': XNav,
		'x-search': XSearch,
		'x-account': XAccount,
		'x-notifications': XNotifications,
		'x-post': XPost,
		'x-clock': XClock,
	}
});
</script>

<style lang="stylus" scoped>
.header
	position -webkit-sticky
	position sticky
	top 0
	z-index 1024
	width 100%
	box-shadow 0 1px 1px rgba(0, 0, 0, 0.075)

	> .main

		> .backdrop
			position absolute
			top 0
			z-index 1023
			width 100%
			height 48px
			backdrop-filter blur(12px)
			background #f7f7f7

			&:after
				content ""
				display block
				width 100%
				height 48px
				background-image url(/assets/desktop/header-logo.svg)
				background-size 46px
				background-position center
				background-repeat no-repeat
				opacity 0.3

		> .main
			z-index 1024
			margin 0
			padding 0
			background-clip content-box
			font-size 0.9rem
			user-select none

			> .container
				display flex
				width 100%
				max-width 1300px
				margin 0 auto

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

</style>
