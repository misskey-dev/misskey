<mk-signin-history-page>
	<mk-ui ref="ui">
		<mk-signin-history/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-signin-history-page.signin-history%';
			ui.trigger('title', '%fa:sign-in%%i18n:mobile.tags.mk-signin-history-page.signin-history%');
		});
	</script>
</mk-signin-history-page>
