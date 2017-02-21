<mk-home-page>
	<mk-ui ref="ui" page={ page }>
		<mk-home ref="home" mode={ parent.opts.mode }></mk-home>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('ui-progress');
		this.mixin('stream');
		this.mixin('get-post-summary');

		this.unreadCount = 0;

		this.page = this.opts.mode || 'timeline';

		this.on('mount', () => {
			this.refs.ui.refs.home.on('loaded', () => {
				this.Progress.done();
			});
			document.title = 'Misskey';
			this.Progress.start();
			this.stream.on('post', this.onStreamPost);
			document.addEventListener('visibilitychange', this.windowOnVisibilitychange, false);
		});

		this.on('unmount', () => {
			this.stream.off('post', this.onStreamPost);
			document.removeEventListener('visibilitychange', this.windowOnVisibilitychange);
		});

		this.onStreamPost = post => {
			if (document.hidden && post.user_id != this.I.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${this.getPostSummary(post)}`;
			}
		};

		this.windowOnVisibilitychange = () => {
			if (!document.hidden) {
				this.unreadCount = 0;
				document.title = 'Misskey';
			}
		};
	</script>
</mk-home-page>
