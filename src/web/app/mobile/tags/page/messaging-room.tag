<mk-messaging-room-page>
	<mk-ui ref="ui">
		<mk-messaging-room if={ !parent.fetching } user={ parent.user } is-naked={ true }/>
	</mk-ui>
	<style lang="stylus" scoped>
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

				document.title = `%i18n:mobile.tags.mk-messaging-room-page.message%: ${user.name} | Misskey`;
				// TODO: ユーザー名をエスケープ
				ui.trigger('title', '%fa:R comments%' + user.name);
			});
		});
	</script>
</mk-messaging-room-page>
