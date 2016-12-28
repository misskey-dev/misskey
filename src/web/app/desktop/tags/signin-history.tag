mk-signin-history
	div.records(if={ history.length != 0 })
		div(each={ history })
			mk-time(time={ created_at })
			header
				i.fa.fa-check(if={ success })
				i.fa.fa-times(if={ !success })
				span.ip { ip }
			pre: code { JSON.stringify(headers, null, '    ') }

style.
	display block

	> .records
		> div
			padding 16px 0 0 0
			border-bottom solid 1px #eee

			> header

				> i
					margin-right 8px

					&.fa-check
						color #0fda82

					&.fa-times
						color #ff3100

				> .ip
					display inline-block
					color #444
					background #f8f8f8

			> mk-time
				position absolute
				top 16px
				right 0
				color #777

			> pre
				overflow auto
				max-height 100px

				> code
					white-space pre-wrap
					word-break break-all
					color #4a535a

script.
	@mixin \api
	@mixin \stream

	@history = []
	@fetching = true

	@on \mount ~>
		@api \i/signin_history
		.then (history) ~>
			@history = history
			@fetching = false
			@update!
		.catch (err) ~>
			console.error err

		@stream.on \signin @on-signin

	@on \unmount ~>
		@stream.off \signin @on-signin

	@on-signin = (signin) ~>
		@history.unshift signin
		@update!
