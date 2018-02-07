<mk-messaging-page>
	<mk-ui ref="ui">
		<mk-messaging ref="index"/>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';

		this.mixin('page');

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-messaging-page.message%';
			ui.trigger('title', '%fa:R comments%%i18n:mobile.tags.mk-messaging-page.message%');

			this.$refs.ui.refs.index.on('navigate-user', user => {
				this.page('/i/messaging/' + user.username);
			});
		});
	</script>
</mk-messaging-page>
