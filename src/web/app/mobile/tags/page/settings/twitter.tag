<mk-twitter-setting-page>
	<mk-ui ref="ui">
		<mk-twitter-setting/>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script>
		import ui from '../../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-twitter-setting-page.twitter-integration%';
			ui.trigger('title', '%fa:B twitter%%i18n:mobile.tags.mk-twitter-setting-page.twitter-integration%');
		});
	</script>
</mk-twitter-setting-page>
