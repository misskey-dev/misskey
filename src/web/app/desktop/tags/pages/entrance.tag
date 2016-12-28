mk-entrance
	main
		img(src='/_/resources/title.svg', alt='Misskey')

		mk-entrance-signin(if={ mode == 'signin' })
		mk-entrance-signup(if={ mode == 'signup' })
		div.introduction(if={ mode == 'introduction' })
			mk-introduction
			button(onclick={ signin }) わかった

	mk-forkit

	footer
		mk-copyright

	// ↓ https://github.com/riot/riot/issues/2134 (将来的)
	style(data-disable-scope).
		#wait {
			right: auto;
			left: 15px;
		}

style.
	display block
	height 100%

	> main
		display block

		> img
			display block
			width 160px
			height 170px
			margin 0 auto
			pointer-events none
			user-select none

		> .introduction
			max-width 360px
			margin 0 auto
			color #777

			> mk-introduction
				padding 32px
				background #fff
				box-shadow 0 4px 16px rgba(0, 0, 0, 0.2)

			> button
				display block
				margin 16px auto 0 auto
				color #666

				&:hover
					text-decoration underline

	> footer
		> mk-copyright
			margin 0
			text-align center
			line-height 64px
			font-size 10px
			color rgba(#000, 0.5)

script.
	@mode = \signin

	@signup = ~>
		@mode = \signup
		@update!

	@signin = ~>
		@mode = \signin
		@update!

	@introduction = ~>
		@mode = \introduction
		@update!
