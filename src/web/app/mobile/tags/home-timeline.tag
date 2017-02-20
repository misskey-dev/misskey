<mk-home-timeline>
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ '表示する投稿がありません。誰かしらをフォローするなどしましょう。' }></mk-timeline>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');
		this.mixin('stream');

		this.init = new Promise (res, rej) =>
			this.api 'posts/timeline' 
			}).then((posts) => {
				res posts
				this.trigger('loaded');

		this.on('mount', () => {
			this.stream.on 'post' this.on-stream-post
			this.stream.on 'follow' this.on-stream-follow
			this.stream.on 'unfollow' this.on-stream-unfollow

		this.on('unmount', () => {
			this.stream.off 'post' this.on-stream-post
			this.stream.off 'follow' this.on-stream-follow
			this.stream.off 'unfollow' this.on-stream-unfollow

		this.more = () => {
			this.api('posts/timeline', {
				max_id: this.refs.timeline.tail!.id

		this.on-stream-post = (post) => {
			this.is-empty = false
			this.update();
			this.refs.timeline.add-post post

		this.on-stream-follow = () => {
			@fetch!

		this.on-stream-unfollow = () => {
			@fetch!
	</script>
</mk-home-timeline>
