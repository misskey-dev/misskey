<mk-user-page>
	<mk-ui ref="ui">
		<mk-user ref="user" user={ parent.user } page={ parent.opts.page }/>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script>
		import Progress from '../../../common/scripts/loading';

		this.user = this.opts.user;

		this.on('mount', () => {
			Progress.start();

			this.$refs.ui.refs.user.on('user-fetched', user => {
				Progress.set(0.5);
				document.title = user.name + ' | Misskey';
			});

			this.$refs.ui.refs.user.on('loaded', () => {
				Progress.done();
			});
		});
	</script>
</mk-user-page>
