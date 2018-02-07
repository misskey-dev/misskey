<mk-search-page>
	<mk-ui ref="ui">
		<mk-search ref="search" query={ parent.opts.query }/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import Progress from '../../../common/scripts/loading';

		this.on('mount', () => {
			Progress.start();

			this.$refs.ui.refs.search.on('loaded', () => {
				Progress.done();
			});
		});
	</script>
</mk-search-page>
