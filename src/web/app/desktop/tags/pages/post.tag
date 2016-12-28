mk-post-page
	mk-ui@ui: main: mk-post-detail@detail(post={ parent.post })

style.
	display block

	main
		padding 16px

		> mk-post-detail
			margin 0 auto

script.
	@mixin \ui-progress

	@post = @opts.post

	@on \mount ~>
		@Progress.start!

		@refs.ui.refs.detail.on \post-fetched ~>
			@Progress.set 0.5

		@refs.ui.refs.detail.on \loaded ~>
			@Progress.done!
