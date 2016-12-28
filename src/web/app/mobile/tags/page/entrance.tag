mk-entrance
	main
		img(src='/_/resources/title.svg', alt='Misskey')

		mk-entrance-signin(if={ mode == 'signin' })
		mk-entrance-signup(if={ mode == 'signup' })
		div.introduction(if={ mode == 'introduction' })
			mk-introduction
			button(onclick={ signin }) わかった

	footer
		mk-copyright

style.
	display block
	height 100%

	> main
		display block

		> img
			display block
			width 130px
			height 120px
			margin 0 auto

		> .introduction
			max-width 300px
			margin 0 auto
			color #666

			> button
				display block
				margin 16px auto 0 auto

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
