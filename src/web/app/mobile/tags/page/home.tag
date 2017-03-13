<mk-home-page>
	<mk-ui ref="ui">
		<mk-home ref="home"></mk-home>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('i');
		this.mixin('ui');
		this.mixin('ui-progress');
		this.mixin('stream');
		this.mixin('get-post-summary');
		this.mixin('open-post-form');

		this.unreadCount = 0;

		this.on('mount', () => {
			document.title = 'Misskey'
			this.ui.trigger('title', '<i class="fa fa-home"></i>ホーム');

			this.ui.trigger('func', () => {
				this.openPostForm();
			}, 'pencil');

			this.Progress.start();

			this.stream.on('post', this.onStreamPost);
			document.addEventListener('visibilitychange', this.onVisibilitychange, false);

			this.refs.ui.refs.home.on('loaded', () => {
				this.Progress.done();
			});
		});

		this.on('unmount', () => {
			this.stream.off('post', this.onStreamPost);
			document.removeEventListener('visibilitychange', this.onVisibilitychange);
		});

		this.onStreamPost = post => {
			if (document.hidden && post.user_id !== this.I.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${this.getPostSummary(post)}`;
			}
		};

		this.onVisibilitychange = () => {
			if (!document.hidden) {
				this.unreadCount = 0;
				document.title = 'Misskey';
			}
		};
	</script>
</mk-home-page>
