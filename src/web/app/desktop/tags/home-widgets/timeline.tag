mk-timeline-home-widget
	mk-following-setuper(if={ no-following })
	div.loading(if={ is-loading })
		mk-ellipsis-icon
	p.empty(if={ is-empty })
		i.fa.fa-comments-o
		| 自分の投稿や、自分がフォローしているユーザーの投稿が表示されます。
	mk-timeline@timeline
		<yield to="footer">
		i.fa.fa-moon-o(if={ !parent.more-loading })
		i.fa.fa-spinner.fa-pulse.fa-fw(if={ parent.more-loading })
		</yield>

style.
	display block
	background #fff

	> mk-following-setuper
		border-bottom solid 1px #eee

	> .loading
		padding 64px 0

	> .empty
		display block
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

script.
	@mixin \i
	@mixin \api
	@mixin \stream

	@is-loading = true
	@is-empty = false
	@more-loading = false
	@no-following = @I.following_count == 0

	@on \mount ~>
		@stream.on \post @on-stream-post
		@stream.on \follow @on-stream-follow
		@stream.on \unfollow @on-stream-unfollow

		document.add-event-listener \keydown @on-document-keydown
		window.add-event-listener \scroll @on-scroll

		@load ~>
			@trigger \loaded

	@on \unmount ~>
		@stream.off \post @on-stream-post
		@stream.off \follow @on-stream-follow
		@stream.off \unfollow @on-stream-unfollow

		document.remove-event-listener \keydown @on-document-keydown
		window.remove-event-listener \scroll @on-scroll

	@on-document-keydown = (e) ~>
		tag = e.target.tag-name.to-lower-case!
		if tag != \input and tag != \textarea
			if e.which == 84 # t
				@refs.timeline.focus!

	@load = (cb) ~>
		@api \posts/timeline
		.then (posts) ~>
			@is-loading = false
			@is-empty = posts.length == 0
			@update!
			@refs.timeline.set-posts posts
			if cb? then cb!
		.catch (err) ~>
			console.error err
			if cb? then cb!

	@more = ~>
		if @more-loading or @is-loading or @refs.timeline.posts.length == 0
			return
		@more-loading = true
		@update!
		@api \posts/timeline do
			max_id: @refs.timeline.tail!.id
		.then (posts) ~>
			@more-loading = false
			@update!
			@refs.timeline.prepend-posts posts
		.catch (err) ~>
			console.error err

	@on-stream-post = (post) ~>
		@is-empty = false
		@update!
		@refs.timeline.add-post post

	@on-stream-follow = ~>
		@load!

	@on-stream-unfollow = ~>
		@load!

	@on-scroll = ~>
		current = window.scroll-y + window.inner-height
		if current > document.body.offset-height - 8
			@more!
