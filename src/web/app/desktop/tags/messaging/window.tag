mk-messaging-window
	mk-window@window(is-modal={ false }, width={ '500px' }, height={ '560px' })
		<yield to="header">
		i.fa.fa-comments
		| メッセージ
		</yield>
		<yield to="content">
		mk-messaging@index
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

		[data-yield='content']
			> mk-messaging
				height 100%

script.
	@on \mount ~>
		@refs.window.on \closed ~>
			@unmount!

		@refs.window.refs.index.on \navigate-user (user) ~>
			w = document.body.append-child document.create-element \mk-messaging-room-window
			riot.mount w, do
				user: user
