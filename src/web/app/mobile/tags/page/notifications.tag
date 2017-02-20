<mk-notifications-page>
	<mk-ui ref="ui">
		<mk-notifications ref="notifications"></mk-notifications>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('ui');
		this.mixin('ui-progress');

		this.on('mount', () => {
			document.title = 'Misskey | 通知';
			this.ui.trigger('title', '<i class="fa fa-bell-o"></i>通知');

			this.Progress.start();

			this.refs.ui.refs.notifications.on('loaded', () => {
				this.Progress.done();
			});
		});
	</script>
</mk-notifications-page>
