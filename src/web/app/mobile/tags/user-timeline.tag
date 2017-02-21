<mk-user-timeline>
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ withMedia ? 'メディア付き投稿はありません。' : 'このユーザーはまだ投稿していないようです。' }></mk-timeline>
	<style>
		:scope
			display block
			max-width 600px
			margin 0 auto
			background #fff

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;
		this.withMedia = this.opts.withMedia;

		this.init = new Promise((res, rej) => {
			this.api('users/posts', {
				user_id: this.user.id,
				with_media: this.withMedia
			}).then(posts => {
				res(posts);
				this.trigger('loaded');
			});
		});

		this.more = () => {
			this.api('users/posts', {
				user_id: this.user.id,
				with_media: this.withMedia,
				max_id: this.refs.timeline.tail().id
			});
		};
	</script>
</mk-user-timeline>
