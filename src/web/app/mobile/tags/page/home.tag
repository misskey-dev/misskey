<mk-home-page>
	<mk-ui ref="ui">
		<mk-home ref="home"/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';
		import getPostSummary from '../../../../../common/get-post-summary.ts';
		import openPostForm from '../../scripts/open-post-form';

		this.mixin('i');
		this.mixin('stream');

		this.unreadCount = 0;

		this.on('mount', () => {
			document.title = 'Misskey'
			ui.trigger('title', '<i class="fa fa-home"></i>%i18n:mobile.tags.mk-home.home%');
			document.documentElement.style.background = '#313a42';

			ui.trigger('func', () => {
				openPostForm();
			}, 'pencil');

			Progress.start();

			this.stream.on('post', this.onStreamPost);
			document.addEventListener('visibilitychange', this.onVisibilitychange, false);

			this.refs.ui.refs.home.on('loaded', () => {
				Progress.done();
			});
		});

		this.on('unmount', () => {
			this.stream.off('post', this.onStreamPost);
			document.removeEventListener('visibilitychange', this.onVisibilitychange);
		});

		this.onStreamPost = post => {
			if (document.hidden && post.user_id !== this.I.id) {
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
