mk-settings-window
	mk-window@window(is-modal={ true }, width={ '700px' }, height={ '550px' })
		<yield to="header">
		i.fa.fa-cog
		| 設定
		</yield>
		<yield to="content">
		mk-settings
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

		[data-yield='content']
			overflow auto

script.
	@on \mount ~>
		@refs.window.on \closed ~>
			@unmount!

	@close = ~>
		@refs.window.close!
