<mk-authorized-apps-page>
	<mk-ui ref="ui">
		<mk-authorized-apps/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-authorized-apps-page.application%';
			ui.trigger('title', '<i class="fa fa-puzzle-piece"></i>%i18n:mobile.tags.mk-authorized-apps-page.application%');
		});
	</script>
</mk-authorized-apps-page>
