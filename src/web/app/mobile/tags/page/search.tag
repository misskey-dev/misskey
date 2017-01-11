<mk-search-page>
	<mk-ui ref="ui">
		<mk-search ref="search" query="{ parent.opts.query }"></mk-search>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui
		@mixin \ui-progress

		@on \mount ~>
			document.title = '検索: ' + @opts.query + ' | Misskey'
			# TODO: クエリをHTMLエスケープ
			@ui.trigger \title '<i class="fa fa-search"></i>' + @opts.query

			@Progress.start!

			@refs.ui.refs.search.on \loaded ~>
				@Progress.done!
	</script>
</mk-search-page>
