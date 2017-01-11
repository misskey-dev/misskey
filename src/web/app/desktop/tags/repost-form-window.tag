<mk-repost-form-window>
	<mk-window ref="window" is-modal={ true } colored={ true }><yield to="header"><i class="fa fa-retweet"></i>この投稿をRepostしますか？</yield>
<yield to="content">
		<mk-repost-form ref="form" post={ parent.opts.post }></mk-repost-form></yield>
	</mk-window>
	<style type="stylus">
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

	</style>
	<script>
		@on-document-keydown = (e) ~>
			tag = e.target.tag-name.to-lower-case!
			if tag != \input and tag != \textarea
				if e.which == 27 # Esc
					@refs.window.close!

		@on \mount ~>
			@refs.window.refs.form.on \cancel ~>
				@refs.window.close!

			@refs.window.refs.form.on \posted ~>
				@refs.window.close!

			document.add-event-listener \keydown @on-document-keydown

			@refs.window.on \closed ~>
				@unmount!

		@on \unmount ~>
			document.remove-event-listener \keydown @on-document-keydown
	</script>
</mk-repost-form-window>
