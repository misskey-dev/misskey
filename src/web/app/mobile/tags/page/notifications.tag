<mk-notifications-page>
	<mk-ui ref="ui">
		<mk-notifications ref="notifications"></mk-notifications>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.on('mount', () => {
			document.title = 'Misskey | 通知';
			ui.trigger('title', '<i class="fa fa-bell-o"></i>通知');

			Progress.start();

			this.refs.ui.refs.notifications.on('fetched', () => {
				Progress.done();
			});
		});
	</script>
</mk-notifications-page>
