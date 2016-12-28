mk-timeline
	virtual(each={ post, i in posts })
		mk-timeline-post(post={ post })
		p.date(if={ i != posts.length - 1 && post._date != posts[i + 1]._date })
			span
				i.fa.fa-angle-up
				| { post._datetext }
			span
				i.fa.fa-angle-down
				| { posts[i + 1]._datetext }
	footer(data-yield='footer')
		| <yield from="footer"/>

style.
	display block

	> mk-timeline-post
		border-bottom solid 1px #eaeaea

		&:first-child
			border-top-left-radius 4px
			border-top-right-radius 4px

		&:last-of-type
			border-bottom none

	> .date
		display block
		margin 0
		line-height 32px
		font-size 14px
		text-align center
		color #aaa
		background #fdfdfd
		border-bottom solid 1px #eaeaea

		span
			margin 0 16px

		i
			margin-right 8px

	> footer
		padding 16px
		text-align center
		color #ccc
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

style(theme='dark').
	> mk-timeline-post
		border-bottom-color #222221

script.
	@posts = []

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

	@clear = ~>
		@posts = []
		@update!

	@focus = ~>
		@root.children.0.focus!

	@on \update ~>
		@posts.for-each (post) ~>
			date = (new Date post.created_at).get-date!
			month = (new Date post.created_at).get-month! + 1
			post._date = date
			post._datetext = month + '月 ' + date + '日'

	@tail = ~>
		@posts[@posts.length - 1]
