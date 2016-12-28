mk-user-page
	mk-ui@ui: mk-user@user(user={ parent.user }, page={ parent.opts.page })

style.
	display block

script.
	@mixin \ui
	@mixin \ui-progress

	@user = @opts.user

	@on \mount ~>
		@Progress.start!

		@refs.ui.refs.user.on \loaded (user) ~>
			@Progress.done!
			document.title = user.name + ' | Misskey'
			# TODO: ユーザー名をエスケープ
			@ui.trigger \title '<i class="fa fa-user"></i>' + user.name
