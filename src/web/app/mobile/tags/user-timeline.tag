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

		this.user = this.opts.user
		this.with-media = this.opts.with-media

		this.init = new Promise (res, rej) =>
			this.api 'users/posts' do
				user_id: @user.id
				with_media: @with-media
			.then (posts) =>
				res posts
				this.trigger('loaded');

		this.more = () => {
			this.api 'users/posts' do
				user_id: @user.id
				with_media: @with-media
				max_id: this.refs.timeline.tail!.id
	</script>
</mk-user-timeline>
