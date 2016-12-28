mk-post-page
	mk-ui@ui: main: mk-post-detail@post(post={ parent.post })

style.
	display block

	main
		background #fff

		> mk-post-detail
			width 100%
			max-width 500px
			margin 0 auto

script.
	@mixin \ui
	@mixin \ui-progress

	@post = @opts.post

	@on \mount ~>
		document.title = 'Misskey'
		@ui.trigger \title '<i class="fa fa-sticky-note-o"></i>投稿'

		@Progress.start!

		@refs.ui.refs.post.on \post-fetched ~>
			@Progress.set 0.5

		@refs.ui.refs.post.on \loaded ~>
			@Progress.done!
