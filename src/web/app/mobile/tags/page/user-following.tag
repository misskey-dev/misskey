<mk-user-following-page>
	<mk-ui ref="ui">
		<mk-user-following ref="list" if={ !parent.fetching } user={ parent.user }></mk-user-following>
	</mk-ui>
	<style>
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

				document.title = user.name + 'のフォロー | Misskey'
				# TODO: ユーザー名をエスケープ
				@ui.trigger \title '<img src="' + user.avatar_url + '?thumbnail&size=64">' + user.name + 'のフォロー'

				@update!

				@refs.ui.refs.list.on \loaded ~>
					@Progress.done!
	</script>
</mk-user-following-page>
