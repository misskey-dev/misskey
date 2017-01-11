<mk-user-page>
	<mk-ui ref="ui">
		<mk-user ref="user" user="{ parent.user }" page="{ parent.opts.page }"></mk-user>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui
		@mixin \ui-progress

		@user = @opts.user

		@on \mount ~>
			@Progress.start!

			@refs.ui.refs.user.on \loaded (user) ~>
				@Progress.done!
				document.title = user.name + ' | Misskey'
				# TODO: ユーザー名をエスケープ
				@ui.trigger \title '<i class="fa fa-user"></i>' + user.name
	</script>
</mk-user-page>
