mk-log-window
	mk-window@window(width={ '600px' }, height={ '400px' })
		<yield to="header">
		i.fa.fa-terminal
		| Log
		</yield>
		<yield to="content">
		mk-log
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

script.
	@on \mount ~>
		@refs.window.on \closed ~>
			@unmount!
