mk-log
	header
		button.follow(class={ following: following }, onclick={ follow }) Follow
	div.logs@logs
		code(each={ logs })
			span.date { date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() }
			span.message { message }

style.
	display block
	height 100%
	color #fff
	background #000

	> header
		height 32px
		background #343a42

		> button
			line-height 32px

		> .follow
			position absolute
			top 0
			right 0

			&.following
				color #ff0

	> .logs
		height calc(100% - 32px)
		overflow auto

		> code
			display block
			padding 4px 8px

			&:hover
				background rgba(#fff, 0.15)

			> .date
				margin-right 8px
				opacity 0.5

script.
	@mixin \log

	@following = true

	@on \mount ~>
		@log-event.on \log @on-log

	@on \unmount ~>
		@log-event.off \log @on-log

	@follow = ~>
		@following = true

	@on-log = ~>
		@update!
		if @following
			@refs.logs.scroll-top = @refs.logs.scroll-height
