mk-repost-form-window
	mk-window@window(is-modal={ true }, colored={ true })
		<yield to="header">
		i.fa.fa-retweet
		| この投稿をRepostしますか？
		</yield>
		<yield to="content">
		mk-repost-form@form(post={ parent.opts.post })
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

script.

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
