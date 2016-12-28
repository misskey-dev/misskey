mk-timeline
	div.init(if={ init })
		i.fa.fa-spinner.fa-pulse
		| 読み込んでいます
	div.empty(if={ !init && posts.length == 0 })
		i.fa.fa-comments-o
		| { opts.empty || '表示するものがありません' }
	virtual(each={ post, i in posts })
		mk-timeline-post(post={ post })
		p.date(if={ i != posts.length - 1 && post._date != posts[i + 1]._date })
			span
				i.fa.fa-angle-up
				| { post._datetext }
			span
				i.fa.fa-angle-down
				| { posts[i + 1]._datetext }
	footer(if={ !init })
		button(if={ can-fetch-more }, onclick={ more }, disabled={ fetching })
			span(if={ !fetching }) もっとみる
			span(if={ fetching })
				| 読み込み中
				mk-ellipsis

style.
	display block
	background #fff
	background-clip content-box
	overflow hidden

	> .init
		padding 64px 0
		text-align center
		color #999

		> i
			margin-right 4px

	> .empty
		margin 0 auto
		padding 32px
		max-width 400px
		text-align center
		color #999

		> i
			display block
			margin-bottom 16px
			font-size 3em
			color #ccc

	> mk-timeline-post
		border-bottom solid 1px #eaeaea

		&:last-of-type
			border-bottom none

	> .date
		display block
		margin 0
		line-height 32px
		text-align center
		font-size 0.9em
		color #aaa
		background #fdfdfd
		border-bottom solid 1px #eaeaea

		span
			margin 0 16px

		i
			margin-right 8px

	> footer
		text-align center
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

		> button
			margin 0
			padding 16px
			width 100%
			color $theme-color

			&:disabled
				opacity 0.7

script.
	@posts = []
	@init = true
	@fetching = false
	@can-fetch-more = true

	@on \mount ~>
		@opts.init.then (posts) ~>
			@init = false
			@set-posts posts

	@on \update ~>
		@posts.for-each (post) ~>
			date = (new Date post.created_at).get-date!
			month = (new Date post.created_at).get-month! + 1
			post._date = date
			post._datetext = month + '月 ' + date + '日'

	@more = ~>
		if @init or @fetching or @posts.length == 0 then return
		@fetching = true
		@update!
		@opts.more!.then (posts) ~>
			@fetching = false
			@prepend-posts posts

	@set-posts = (posts) ~>
		@posts = posts
		@update!

	@prepend-posts = (posts) ~>
		posts.for-each (post) ~>
			@posts.push post
			@update!

	@add-post = (post) ~>
		@posts.unshift post
		@update!

	@tail = ~>
		@posts[@posts.length - 1]
