<mk-messaging-page>
	<mk-ui ref="ui">
		<mk-messaging ref="index"></mk-messaging>
	</mk-ui>
	<style type="stylus">
		:scope
			display block
	</style>
	<script>
		@mixin \ui
		@mixin \page

		@on \mount ~>
			document.title = 'Misskey | メッセージ'
			@ui.trigger \title '<i class="fa fa-comments-o"></i>メッセージ'

			@refs.ui.refs.index.on \navigate-user (user) ~>
				@page '/i/messaging/' + user.username

	</script>
</mk-messaging-page>
