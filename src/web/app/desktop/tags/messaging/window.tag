<mk-messaging-window>
	<mk-window ref="window" is-modal={ false } width={ '500px' } height={ '560px' }><yield to="header"><i class="fa fa-comments"></i>メッセージ</yield>
<yield to="content">
		<mk-messaging ref="index"></mk-messaging></yield>
	</mk-window>
	<style type="stylus">
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					> mk-messaging
						height 100%

	</style>
	<script>
		@on \mount ~>
			@refs.window.on \closed ~>
				@unmount!

			@refs.window.refs.index.on \navigate-user (user) ~>
				w = document.body.append-child document.create-element \mk-messaging-room-window
				riot.mount w, do
					user: user
	</script>
</mk-messaging-window>
