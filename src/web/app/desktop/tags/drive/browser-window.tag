mk-drive-browser-window
	mk-window@window(is-modal={ false }, width={ '800px' }, height={ '500px' })
		<yield to="header">
		i.fa.fa-cloud
		| ドライブ
		</yield>
		<yield to="content">
		mk-drive-browser(multiple={ true }, folder={ parent.folder })
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

		[data-yield='content']
			> mk-drive-browser
				height 100%

script.
	@folder = if @opts.folder? then @opts.folder else null

	@on \mount ~>
		@refs.window.on \closed ~>
			@unmount!

	@close = ~>
		@refs.window.close!
