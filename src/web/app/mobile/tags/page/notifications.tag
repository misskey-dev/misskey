<mk-notifications-page>
	<mk-ui ref="ui">
		<mk-notifications ref="notifications"/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-notifications-page.notifications%';
			ui.trigger('title', '<i class="fa fa-bell-o"></i>%i18n:mobile.tags.mk-notifications-page.notifications%');
			document.documentElement.style.background = '#313a42';

			ui.trigger('func', () => {
				this.readAll();
			}, 'check');

			Progress.start();

			this.refs.ui.refs.notifications.on('fetched', () => {
				Progress.done();
			});
		});

		this.readAll = () => {
			const ok = window.confirm('%i18n:mobile.tags.mk-notifications-page.read-all%');

			if (!ok) return;

			this.api('notifications/mark_as_read_all');
		};
	</script>
</mk-notifications-page>
