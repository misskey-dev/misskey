<mk-messaging-room-page>
	<mk-ui ref="ui">
		<mk-messaging-room if={ !parent.fetching } user={ parent.user } is-naked={ true }></mk-messaging-room>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';

		this.mixin('api');

		this.fetching = true;

		this.on('mount', () => {
			this.api('users/show', {
				username: this.opts.username
			}).then(user => {
				this.update({
					fetching: false,
					user: user
				});

				document.title = `メッセージ: ${user.name} | Misskey`;
				// TODO: ユーザー名をエスケープ
				ui.trigger('title', '<i class="fa fa-comments-o"></i>' + user.name);
			});
		});
	</script>
</mk-messaging-room-page>
