<mk-home-page>
	<mk-ui ref="ui" page={ page }>
		<mk-home ref="home" mode={ parent.opts.mode }></mk-home>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \i
		@mixin \api
		@mixin \ui-progress
		@mixin \stream
		@mixin \get-post-summary

		@unread-count = 0

		@page = switch @opts.mode
			| \timelie => \home
			| \mentions => \mentions
			| _ => \home

		@on \mount ~>
			@refs.ui.refs.home.on \loaded ~>
				@Progress.done!

			document.title = 'Misskey'
			@Progress.start!
			@stream.on \post @on-stream-post
			document.add-event-listener \visibilitychange @window-on-visibilitychange, false

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
	</script>
</mk-home-page>
