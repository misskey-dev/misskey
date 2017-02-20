<mk-messaging-page>
	<mk-ui ref="ui">
		<mk-messaging ref="index"></mk-messaging>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');
		this.mixin('page');

		this.on('mount', () => {
			document.title = 'Misskey | メッセージ'
			this.ui.trigger('title', '<i class="fa fa-comments-o"></i>メッセージ');

			this.refs.ui.refs.index.on('navigate-user', (user) => {
				this.page '/i/messaging/' + user.username

	</script>
</mk-messaging-page>
