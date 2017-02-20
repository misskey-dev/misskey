<mk-messaging-room-page>
	<mk-ui ref="ui">
		<mk-messaging-room if={ !parent.fetching } user={ parent.user }></mk-messaging-room>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('api');
		this.mixin('ui');

		this.fetching = true

		this.on('mount', () => {
			this.api('users/show', {
				username: this.opts.username
			}).then(user => {
				this.fetching = false
				this.user = user
				this.update();

				document.title = 'メッセージ: ' + user.name + ' | Misskey'
				// TODO: ユーザー名をエスケープ
				this.ui.trigger('title', '<i class="fa fa-comments-o"></i>'); + user.name
	</script>
</mk-messaging-room-page>
