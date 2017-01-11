<mk-messaging-room-window>
	<mk-window ref="window" is-modal="{ false }" width="{ '500px' }" height="{ '560px' }"><yield to="header"><i class="fa fa-comments"></i>メッセージ: { parent.user.name }</yield>
<yield to="content">
		<mk-messaging-room user="{ parent.user }"></mk-messaging-room></yield>
	</mk-window>
	<style type="stylus">
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					> mk-messaging-room
						height 100%

	</style>
	<script>
		@user = @opts.user

		@on \mount ~>
			@refs.window.on \closed ~>
				@unmount!
	</script>
</mk-messaging-room-window>
