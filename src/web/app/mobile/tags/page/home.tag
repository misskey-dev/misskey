mk-home-page
	mk-ui@ui: mk-home@home

style.
	display block

script.
	@mixin \i
	@mixin \ui
	@mixin \ui-progress
	@mixin \stream
	@mixin \get-post-summary

	@unread-count = 0

	@on \mount ~>
		document.title = 'Misskey'
		@ui.trigger \title '<i class="fa fa-home"></i>ホーム'

		@Progress.start!

		@stream.on \post @on-stream-post
		document.add-event-listener \visibilitychange @window-on-visibilitychange, false

		@refs.ui.refs.home.on \loaded ~>
			@Progress.done!

	@on \unmount ~>
		@stream.off \post @on-stream-post
		document.remove-event-listener \visibilitychange @window-on-visibilitychange

	@on-stream-post = (post) ~>
		if document.hidden and post.user_id !== @I.id
			@unread-count++
			document.title = '(' + @unread-count + ') ' + @get-post-summary post

	@window-on-visibilitychange = ~>
		if !document.hidden
			@unread-count = 0
			document.title = 'Misskey'
