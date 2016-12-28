mk-user-page
	mk-ui@ui: mk-user@user(user={ parent.user }, page={ parent.opts.page })

style.
	display block

script.
	@mixin \ui-progress

	@user = @opts.user

	@on \mount ~>
		@Progress.start!

		@refs.ui.refs.user.on \user-fetched (user) ~>
			@Progress.set 0.5
			document.title = user.name + ' | Misskey'

		@refs.ui.refs.user.on \loaded ~>
			@Progress.done!
