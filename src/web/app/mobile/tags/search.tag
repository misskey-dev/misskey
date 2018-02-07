<mk-search>
	<mk-search-posts ref="posts" query={ query }/>
	<style>
		:scope
			display block
	</style>
	<script>
		this.query = this.opts.query;

		this.on('mount', () => {
			this.$refs.posts.on('loaded', () => {
				this.trigger('loaded');
			});
		});
	</script>
</mk-search>
