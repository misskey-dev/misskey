<mk-settings-page>
	<mk-ui ref="ui">
		<ul>
			<li><a><i class="fa fa-user"></i>%i18n:mobile.tags.mk-settings-page.profile%</a></li>
			<li><a href="./settings/authorized-apps"><i class="fa fa-puzzle-piece"></i>%i18n:mobile.tags.mk-settings-page.applications%</a></li>
			<li><a href="./settings/twitter"><i class="fa fa-twitter"></i>%i18n:mobile.tags.mk-settings-page.twitter-integration%</a></li>
			<li><a href="./settings/signin-history"><i class="fa fa-sign-in"></i>%i18n:mobile.tags.mk-settings-page.signin-history%</a></li>
			<li><a href="./settings/api"><i class="fa fa-key"></i>API</a></li>
		</ul>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-settings-page.settings%';
			ui.trigger('title', '<i class="fa fa-cog"></i>%i18n:mobile.tags.mk-settings-page.settings%');
		});
	</script>
</mk-settings-page>
