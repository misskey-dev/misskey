<mk-search-page>
	<mk-ui ref="ui">
		<mk-search ref="search" query={ parent.opts.query }></mk-search>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('ui-progress');

		this.on('mount', () => {
			this.Progress.start();

			this.refs.ui.refs.search.on('loaded', () => {
				this.Progress.done();
	</script>
</mk-search-page>
