<mk-home-page>
	<mk-ui ref="ui">
		<mk-home ref="home"/>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';
		import getPostSummary from '../../../../../common/get-post-summary.ts';
		import openPostForm from '../../scripts/open-post-form';

		this.mixin('i');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.unreadCount = 0;

		this.on('mount', () => {
			document.title = 'Misskey'
			ui.trigger('title', '%fa:home%%i18n:mobile.tags.mk-home.home%');
			document.documentElement.style.background = '#313a42';

			ui.trigger('func', () => {
				openPostForm();
			}, '%fa:pencil-alt%');

			Progress.start();

			this.connection.on('post', this.onStreamPost);
			document.addEventListener('visibilitychange', this.onVisibilitychange, false);

			this.$refs.ui.refs.home.on('loaded', () => {
				Progress.done();
			});
		});

		this.on('unmount', () => {
			this.connection.off('post', this.onStreamPost);
			this.stream.dispose(this.connectionId);
			document.removeEventListener('visibilitychange', this.onVisibilitychange);
		});

		this.onStreamPost = post => {
			if (document.hidden && post.user_id !== this.$root.$data.os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getPostSummary(post)}`;
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
