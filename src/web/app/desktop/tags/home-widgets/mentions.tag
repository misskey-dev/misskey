mk-mentions-home-widget
	header
		span(data-is-active={ mode == 'all' }, onclick={ set-mode.bind(this, 'all') }) すべて
		span(data-is-active={ mode == 'following' }, onclick={ set-mode.bind(this, 'following') }) フォロー中
	div.loading(if={ is-loading })
		mk-ellipsis-icon
	p.empty(if={ is-empty })
		i.fa.fa-comments-o
		span(if={ mode == 'all' }) あなた宛ての投稿はありません。
		span(if={ mode == 'following' }) あなたがフォローしているユーザーからの言及はありません。
	mk-timeline@timeline
		<yield to="footer">
		i.fa.fa-moon-o(if={ !parent.more-loading })
		i.fa.fa-spinner.fa-pulse.fa-fw(if={ parent.more-loading })
		</yield>

style.
	display block
	background #fff

	> header
		padding 8px 16px
		border-bottom solid 1px #eee

		> span
			margin-right 16px
			line-height 27px
			font-size 18px
			color #555

			&:not([data-is-active])
				color $theme-color
				cursor pointer

				&:hover
					text-decoration underline

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

	@is-loading = true
	@is-empty = false
	@more-loading = false
	@mode = \all

	@on \mount ~>
		document.add-event-listener \keydown @on-document-keydown
		window.add-event-listener \scroll @on-scroll

		@fetch ~>
			@trigger \loaded

	@on \unmount ~>
		document.remove-event-listener \keydown @on-document-keydown
		window.remove-event-listener \scroll @on-scroll

	@on-document-keydown = (e) ~>
		tag = e.target.tag-name.to-lower-case!
		if tag != \input and tag != \textarea
			if e.which == 84 # t
				@refs.timeline.focus!

	@fetch = (cb) ~>
		@api \posts/mentions do
			following: @mode == \following
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
		@api \posts/mentions do
			following: @mode == \following
			max_id: @refs.timeline.tail!.id
		.then (posts) ~>
			@more-loading = false
			@update!
			@refs.timeline.prepend-posts posts
		.catch (err) ~>
			console.error err

	@on-scroll = ~>
		current = window.scroll-y + window.inner-height
		if current > document.body.offset-height - 8
			@more!

	@set-mode = (mode) ~>
		@update do
			mode: mode
		@fetch!
