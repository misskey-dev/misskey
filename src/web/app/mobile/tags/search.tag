<mk-search>
	<mk-search-posts ref="posts" query={ query }/>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.query = this.opts.query;

		this.on('mount', () => {
			this.$refs.posts.on('loaded', () => {
				this.$emit('loaded');
			});
		});
	</script>
</mk-search>
