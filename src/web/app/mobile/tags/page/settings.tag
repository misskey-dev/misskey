<mk-settings-page>
	<mk-ui ref="ui">
		<ul>
			<li><a><i class="fa fa-user"></i>プロフィール</a></li>
			<li><a href="./settings/authorized-apps"><i class="fa fa-puzzle-piece"></i>アプリケーション</a></li>
			<li><a href="./settings/twitter"><i class="fa fa-twitter"></i>Twitter連携</a></li>
			<li><a href="./settings/signin-history"><i class="fa fa-sign-in"></i>ログイン履歴</a></li>
			<li><a href="./settings/api"><i class="fa fa-key"></i>API</a></li>
		</ul>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');

		this.on('mount', () => {
			document.title = 'Misskey | 設定'
			this.ui.trigger('title', '<i class="fa fa-cog"></i>設定');
	</script>
</mk-settings-page>
