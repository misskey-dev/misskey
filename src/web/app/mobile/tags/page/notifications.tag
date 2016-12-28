mk-notifications-page
	mk-ui@ui: mk-notifications@notifications

style.
	display block

script.
	@mixin \ui
	@mixin \ui-progress

	@on \mount ~>
		document.title = 'Misskey | 通知'
		@ui.trigger \title '<i class="fa fa-bell-o"></i>通知'

		@Progress.start!

		@refs.ui.refs.notifications.on \loaded ~>
			@Progress.done!
