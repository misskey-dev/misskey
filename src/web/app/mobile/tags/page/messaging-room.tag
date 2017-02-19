<mk-messaging-room-page>
	<mk-ui ref="ui">
		<mk-messaging-room if={ !parent.fetching } user={ parent.user }></mk-messaging-room>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		@mixin \api
		@mixin \ui

		@fetching = true

		@on \mount ~>
			@api \users/show do
				username: @opts.username
			.then (user) ~>
				@fetching = false
				@user = user
				@update!

				document.title = 'メッセージ: ' + user.name + ' | Misskey'
				# TODO: ユーザー名をエスケープ
				@ui.trigger \title '<i class="fa fa-comments-o"></i>' + user.name
	</script>
</mk-messaging-room-page>
