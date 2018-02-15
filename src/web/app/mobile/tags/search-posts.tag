<mk-search-posts>
	<mk-timeline init={ init } more={ more } empty={ '%i18n:mobile.tags.mk-search-posts.empty%'.replace('{}', query) }/>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 8px auto
			max-width 500px
			width calc(100% - 16px)
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			@media (min-width 500px)
				margin 16px auto
				width calc(100% - 32px)
	</style>
	<script lang="typescript">
		import parse from '../../common/scripts/parse-search-query';

		this.mixin('api');

		this.limit = 30;
		this.offset = 0;

		this.query = this.opts.query;

		this.init = new Promise((res, rej) => {
			this.$root.$data.os.api('posts/search', parse(this.query)).then(posts => {
				res(posts);
				this.$emit('loaded');
			});
		});

		this.more = () => {
			this.offset += this.limit;
			return this.$root.$data.os.api('posts/search', Object.assign({}, parse(this.query), {
				limit: this.limit,
				offset: this.offset
			}));
		};
	</script>
</mk-search-posts>
