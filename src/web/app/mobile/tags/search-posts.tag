mk-search-posts
	mk-timeline(init={ init }, more={ more }, empty={ '「' + query + '」に関する投稿は見つかりませんでした。' })

style.
	display block
	background #fff

script.
	@mixin \api

	@max = 30
	@offset = 0

	@query = @opts.query
	@with-media = @opts.with-media

	@init = new Promise (res, rej) ~>
		@api \posts/search do
			query: @query
		.then (posts) ~>
			res posts
			@trigger \loaded

	@more = ~>
		@offset += @max
		@api \posts/search do
			query: @query
			max: @max
			offset: @offset
