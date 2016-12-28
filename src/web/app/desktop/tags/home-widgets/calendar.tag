mk-calendar-home-widget(data-special={ special })
	div.calendar(data-is-holiday={ is-holiday })
		p.month-and-year
			span.year { year }年
			span.month { month }月
		p.day { day }日
		p.week-day { week-day }曜日
	div.info
		div
			p
				| 今日:
				b { day-p.to-fixed(1) }%
			div.meter
				div.val(style={ 'width:' + day-p + '%' })

		div
			p
				| 今月:
				b { month-p.to-fixed(1) }%
			div.meter
				div.val(style={ 'width:' + month-p + '%' })

		div
			p
				| 今年:
				b { year-p.to-fixed(1) }%
			div.meter
				div.val(style={ 'width:' + year-p + '%' })

style.
	display block
	padding 16px 0
	color #777
	background #fff

	&[data-special='on-new-years-day']
		border-color #ef95a0 !important

	&:after
		content ""
		display block
		clear both

	> .calendar
		float left
		width 60%
		text-align center

		&[data-is-holiday]
			> .day
				color #ef95a0

		> p
			margin 0
			line-height 18px
			font-size 14px

			> span
				margin 0 4px

		> .day
			margin 10px 0
			line-height 32px
			font-size 28px

	> .info
		display block
		float left
		width 40%
		padding 0 16px 0 0

		> div
			margin-bottom 8px

			&:last-child
				margin-bottom 4px

			> p
				margin 0 0 2px 0
				font-size 12px
				line-height 18px
				color #888

				> b
					margin-left 2px

			> .meter
				width 100%
				overflow hidden
				background #eee
				border-radius 8px

				> .val
					height 4px
					background $theme-color

			&:nth-child(1)
				> .meter > .val
					background #f7796c

			&:nth-child(2)
				> .meter > .val
					background #a1de41

			&:nth-child(3)
				> .meter > .val
					background #41ddde

script.
	@draw = ~>
		now = new Date!
		nd = now.get-date!
		nm = now.get-month!
		ny = now.get-full-year!

		@year = ny
		@month = nm + 1
		@day = nd
		@week-day = [\日 \月 \火 \水 \木 \金 \土][now.get-day!]

		@day-numer   = (now - (new Date ny, nm, nd))
		@day-denom   = 1000ms * 60s * 60m * 24h
		@month-numer = (now - (new Date ny, nm, 1))
		@month-denom = (new Date ny, nm + 1,  1) - (new Date ny, nm, 1)
		@year-numer  = (now - (new Date ny, 0, 0))
		@year-denom  = (new Date ny + 1, 0,  0) - (new Date ny, 0, 0)

		@day-p   = @day-numer   / @day-denom   * 100
		@month-p = @month-numer / @month-denom * 100
		@year-p  = @year-numer  / @year-denom  * 100

		@is-holiday =
			(now.get-day! == 0 or now.get-day! == 6)

		@special =
			| nm == 0 and nd == 1 => \on-new-years-day
			| _ => false

		@update!

	@draw!

	@on \mount ~>
		@clock = set-interval @draw, 1000ms

	@on \unmount ~>
		clear-interval @clock
