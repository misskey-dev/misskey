<mk-user-page>
	<mk-ui ref="ui">
		<mk-user ref="user" user="{ parent.user }" page="{ parent.opts.page }"></mk-user>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui-progress

		@user = @opts.user

		@on \mount ~>
			@Progress.start!

			@refs.ui.refs.user.on \user-fetched (user) ~>
				@Progress.set 0.5
				document.title = user.name + ' | Misskey'

			@refs.ui.refs.user.on \loaded ~>
				@Progress.done!
	</script>
</mk-user-page>
