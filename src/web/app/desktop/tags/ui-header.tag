mk-ui-header
	mk-donation(if={ SIGNIN && !I.data.no_donation })
	mk-special-message
	div.main
		div.backdrop
		div.main: div.container
			div.left
				mk-ui-header-nav(page={ opts.page })
			div.right
				mk-ui-header-search
				mk-ui-header-account(if={ SIGNIN })
				mk-ui-header-notifications(if={ SIGNIN })
				mk-ui-header-post-button(if={ SIGNIN })
				mk-ui-header-clock

style.
	display block
	position fixed
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
			//background-color rgba(255, 255, 255, 0.75)
			background #fff

			&:after
				content ""
				display block
				width 100%
				height 48px
				background-image url(/_/resources/desktop/header-logo.svg)
				background-size 64px
				background-position center
				background-repeat no-repeat

		> .main
			z-index 1024
			margin 0
			padding 0
			background-clip content-box
			font-size 0.9rem
			user-select none

			> .container
				width 100%
				max-width 1300px
				margin 0 auto

				&:after
					content ""
					display block
					clear both

				> .left
					float left
					height 3rem

				> .right
					float right
					height 48px

					@media (max-width 1100px)
						> mk-ui-header-search
							display none

style(theme='dark').
	box-shadow 0 1px 0 #222221

	> .main

		> .backdrop
			background #0D0D0D

script.
	@mixin \i
