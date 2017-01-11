<mk-user-followers-page>
	<mk-ui ref="ui">
		<mk-user-followers ref="list" if="{ !parent.fetching }" user="{ parent.user }"></mk-user-followers>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui
		@mixin \ui-progress
		@mixin \api

		@fetching = true
		@user = null

		@on \mount ~>
			@Progress.start!

			@api \users/show do
				username: @opts.user
			.then (user) ~>
				@user = user
				@fetching = false

				document.title = user.name + 'のフォロワー | Misskey'
				# TODO: ユーザー名をエスケープ
				@ui.trigger \title '<img src="' + user.avatar_url + '?thumbnail&size=64">' + user.name + 'のフォロー'

				@update!

				@refs.ui.refs.list.on \loaded ~>
					@Progress.done!
	</script>
</mk-user-followers-page>
