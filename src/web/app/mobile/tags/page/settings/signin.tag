<mk-signin-history-page>
	<mk-ui ref="ui">
		<mk-signin-history></mk-signin-history>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		@mixin \ui

		@on \mount ~>
			document.title = 'Misskey | ログイン履歴'
			@ui.trigger \title '<i class="fa fa-sign-in"></i>ログイン履歴'
	</script>
</mk-signin-history-page>
