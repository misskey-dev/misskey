<mk-search>
	<mk-search-posts ref="posts" query={ query }></mk-search-posts>
	<style>
		:scope
			display block

	</style>
	<script>
		@query = @opts.query

		@on \mount ~>
			@refs.posts.on \loaded ~>
				@trigger \loaded
	</script>
</mk-search>
