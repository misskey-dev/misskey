<template>
<div class="mk-ui-header">
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="main">
			<div class="container">
				<div class="left">
					<mk-ui-header-nav/>
				</div>
				<div class="right">
					<mk-ui-header-search/>
					<mk-ui-header-account v-if="$root.$data.os.isSignedIn"/>
					<mk-ui-header-notifications v-if="$root.$data.os.isSignedIn"/>
					<mk-ui-header-post-button v-if="$root.$data.os.isSignedIn"/>
					<mk-ui-header-clock/>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<style lang="stylus" scoped>
.mk-ui-header
	display block
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
