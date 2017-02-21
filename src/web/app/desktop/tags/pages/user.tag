<mk-user-page>
	<mk-ui ref="ui">
		<mk-user ref="user" user={ parent.user } page={ parent.opts.page }></mk-user>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui-progress');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.Progress.start();

			this.refs.ui.refs.user.on('user-fetched', user => {
				this.Progress.set(0.5);
				document.title = user.name + ' | Misskey'
			});

			this.refs.ui.refs.user.on('loaded', () => {
				this.Progress.done();
			});
		});
	</script>
</mk-user-page>
