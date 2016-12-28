mk-not-found
	mk-ui
		main
			h1 Not Found
			img(src='/_/resources/rogge.jpg', alt='')
			div.mask

style.
	display block

	main
		display block
		width 600px
		margin 32px auto

		> img
			display block
			width 600px
			height 459px
			pointer-events none
			user-select none
			border-radius 16px
			box-shadow 0 0 16px rgba(0, 0, 0, 0.1)

		> h1
			display block
			margin 0
			padding 0
			position absolute
			top 260px
			left 225px
			transform rotate(-12deg)
			z-index 2
			color #444
			font-size 24px
			line-height 20px

		> .mask
			position absolute
			top 262px
			left 217px
			width 126px
			height 18px
			transform rotate(-12deg)
			background #D6D5DA
			border-radius 2px 6px 7px 6px
