<mk-home-timeline>
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ '表示する投稿がありません。誰かしらをフォローするなどしましょう。' }></mk-timeline>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('stream');

		const stream = this.stream.event;

		this.init = new Promise((res, rej) => {
			this.api('posts/timeline').then(posts => {
				res(posts);
				this.trigger('loaded');
			});
		});

		this.on('mount', () => {
			stream.on('post', this.onStreamPost);
			stream.on('follow', this.onStreamFollow);
			stream.on('unfollow', this.onStreamUnfollow);
		});

		this.on('unmount', () => {
			stream.off('post', this.onStreamPost);
			stream.off('follow', this.onStreamFollow);
			stream.off('unfollow', this.onStreamUnfollow);
		});

		this.more = () => {
			return this.api('posts/timeline', {
				max_id: this.refs.timeline.tail().id
			});
		};

		this.onStreamPost = post => {
			this.update({
				isEmpty: false
			});
			this.refs.timeline.addPost(post);
		};

		this.onStreamFollow = () => {
			this.fetch();
		};

		this.onStreamUnfollow = () => {
			this.fetch();
		};
	</script>
</mk-home-timeline>
