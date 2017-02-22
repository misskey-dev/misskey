<mk-search-posts>
	<mk-timeline init={ init } more={ more } empty={ '「' + query + '」に関する投稿は見つかりませんでした。' }></mk-timeline>
	<style>
		:scope
			display block
			background #fff

	</style>
	<script>
		this.mixin('api');

		this.max = 30;
		this.offset = 0;

		this.query = this.opts.query;
		this.withMedia = this.opts.withMedia;

		this.init = new Promise((res, rej) => {
			this.api('posts/search', {
				query: this.query
			}).then(posts => {
				res(posts);
				this.trigger('loaded');
			});
		});

		this.more = () => {
			this.offset += this.max;
			return this.api('posts/search', {
				query: this.query,
				max: this.max,
				offset: this.offset
			});
		};
	</script>
</mk-search-posts>
