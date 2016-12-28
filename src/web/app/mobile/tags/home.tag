mk-home
	mk-home-timeline@tl

style.
	display block

	> mk-home-timeline
		max-width 600px
		margin 0 auto

	@media (min-width 500px)
		padding 16px

script.
	@on \mount ~>
		@refs.tl.on \loaded ~>
			@trigger \loaded
