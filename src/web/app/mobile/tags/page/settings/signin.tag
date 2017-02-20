<mk-signin-history-page>
	<mk-ui ref="ui">
		<mk-signin-history></mk-signin-history>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');

		this.on('mount', () => {
			document.title = 'Misskey | ログイン履歴';
			this.ui.trigger('title', '<i class="fa fa-sign-in"></i>ログイン履歴');
		});
	</script>
</mk-signin-history-page>
