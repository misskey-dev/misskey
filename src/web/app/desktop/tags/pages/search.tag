<mk-search-page>
	<mk-ui ref="ui">
		<mk-search ref="search" query={ parent.opts.query }></mk-search>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		@mixin \ui-progress

		@on \mount ~>
			@Progress.start!

			@refs.ui.refs.search.on \loaded ~>
				@Progress.done!
	</script>
</mk-search-page>
