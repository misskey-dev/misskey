<mk-home-page>
	<mk-ui ref="ui" page={ page }>
		<mk-home ref="home" mode={ parent.opts.mode }/>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		import Progress from '../../../common/scripts/loading';
		import getPostSummary from '../../../../../common/get-post-summary.ts';

		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.unreadCount = 0;
		this.page = this.opts.mode || 'timeline';

		this.on('mount', () => {
			this.$refs.ui.refs.home.on('loaded', () => {
				Progress.done();
			});
			document.title = 'Misskey';
			Progress.start();

			this.connection.on('post', this.onStreamPost);
			document.addEventListener('visibilitychange', this.windowOnVisibilitychange, false);
		});

		this.on('unmount', () => {
			this.connection.off('post', this.onStreamPost);
			this.stream.dispose(this.connectionId);
			document.removeEventListener('visibilitychange', this.windowOnVisibilitychange);
		});

		this.onStreamPost = post => {
			if (document.hidden && post.user_id != this.$root.$data.os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getPostSummary(post)}`;
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
