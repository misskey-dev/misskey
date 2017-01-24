<mk-settings-page>
	<mk-ui ref="ui">
		<ul>
			<li><a><i class="fa fa-user"></i>プロフィール</a></li>
			<li><a href="./settings/twitter"><i class="fa fa-twitter"></i>Twitter連携</a></li>
			<li><a href="./settings/signin-history"><i class="fa fa-sign-in"></i>ログイン履歴</a></li>
			<li><a href="./settings/api"><i class="fa fa-key"></i>API</a></li>
		</ul>
	</mk-ui>
	<style type="stylus">
		:scope
			display block
	</style>
	<script>
		@mixin \ui

		@on \mount ~>
			document.title = 'Misskey | 設定'
			@ui.trigger \title '<i class="fa fa-cog"></i>設定'
	</script>
</mk-settings-page>
