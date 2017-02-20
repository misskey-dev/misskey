<mk-user-page>
	<mk-ui ref="ui">
		<mk-user ref="user" user={ parent.user } page={ parent.opts.page }></mk-user>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('ui');
		this.mixin('ui-progress');

		this.user = this.opts.user

		this.on('mount', () => {
			this.Progress.start();

			this.refs.ui.refs.user.on('loaded', (user) => {
				this.Progress.done();
				document.title = user.name + ' | Misskey'
				// TODO: ユーザー名をエスケープ
				this.ui.trigger('title', '<i class="fa fa-user"></i>'); + user.name
	</script>
</mk-user-page>
