mk-detect-slow-internet-connection-notice
	i: i.fa.fa-exclamation
	div: p インターネット回線が遅いようです。

style.
	display block
	pointer-events none
	position fixed
	z-index 16384
	top 64px
	right 16px
	margin 0
	padding 0
	width 298px
	font-size 0.9em
	background #fff
	box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)
	opacity 0

	> i
		display block
		width 48px
		line-height 48px
		margin-right 0.25em
		text-align center
		color $theme-color-foreground
		font-size 1.5em
		background $theme-color

	> div
		display block
		position absolute
		top 0
		left 48px
		margin 0
		width 250px
		height 48px
		color #666

		> p
			display block
			margin 0
			padding 8px

script.
	@mixin \net

	@net.on \detected-slow-network ~>
		Velocity @root, {
			opacity: 1
		} 200ms \linear
		set-timeout ~>
			Velocity @root, {
				opacity: 0
			} 200ms \linear
		, 10000ms
