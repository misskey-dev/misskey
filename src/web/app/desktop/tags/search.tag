<mk-search>
	<header>
		<h1>{ query }</h1>
	</header>
	<mk-search-posts ref="posts" query={ query }/>
	<style>
		:scope
			display block
			padding-bottom 32px

			> header
				width 100%
				max-width 600px
				margin 0 auto
				color #555

			> mk-search-posts
				max-width 600px
				margin 0 auto
				border solid 1px rgba(0, 0, 0, 0.075)
				border-radius 6px
				overflow hidden

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
