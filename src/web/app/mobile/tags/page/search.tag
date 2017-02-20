<mk-search-page>
	<mk-ui ref="ui">
		<mk-search ref="search" query={ parent.opts.query }></mk-search>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('ui');
		this.mixin('ui-progress');

		this.on('mount', () => {
			document.title = '検索: ' + this.opts.query + ' | Misskey'
			// TODO: クエリをHTMLエスケープ
			this.ui.trigger('title', '<i class="fa fa-search"></i>'); + this.opts.query

			this.Progress.start();

			this.refs.ui.refs.search.on('loaded', () => {
				this.Progress.done();
	</script>
</mk-search-page>
