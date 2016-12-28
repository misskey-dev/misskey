mk-ui-header-clock
	div.header
		time@time
	div.content
		mk-analog-clock

style.
	display inline-block
	overflow visible

	> .header
		padding 0 12px
		text-align center
		font-size 0.5em

		&, *
			cursor: default

		&:hover
			background #899492

			& + .content
				visibility visible

			> time
				color #fff !important

				*
					color #fff !important

		&:after
			content ""
			display block
			clear both

		> time
			display table-cell
			vertical-align middle
			height 48px
			color #9eaba8

			> .yyyymmdd
				opacity 0.7

	> .content
		visibility hidden
		display block
		position absolute
		top auto
		right 0
		z-index 3
		margin 0
		padding 0
		width 256px
		background #899492

script.
	@draw = ~>
		now = new Date!

		yyyy = now.get-full-year!
		mm = (\0 + (now.get-month! + 1)).slice -2
		dd = (\0 + now.get-date!).slice -2
		yyyymmdd = "<span class='yyyymmdd'>#yyyy/#mm/#dd</span>"

		hh = (\0 + now.get-hours!).slice -2
		mm = (\0 + now.get-minutes!).slice -2
		hhmm = "<span class='hhmm'>#hh:#mm</span>"

		if now.get-seconds! % 2 == 0
			hhmm .= replace \: '<span style=\'visibility:visible\'>:</span>'
		else
			hhmm .= replace \: '<span style=\'visibility:hidden\'>:</span>'

		@refs.time.innerHTML = "#yyyymmdd<br>#hhmm"

	@on \mount ~>
		@draw!
		@clock = set-interval @draw, 1000ms

	@on \unmount ~>
		clear-interval @clock
