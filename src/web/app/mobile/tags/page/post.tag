<mk-post-page>
	<mk-ui ref="ui">
		<main>
			<mk-post-detail ref="post" post={ parent.post }></mk-post-detail>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

			main
				background #fff

				> mk-post-detail
					width 100%
					max-width 500px
					margin 0 auto

	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.post = this.opts.post;

		this.on('mount', () => {
			document.title = 'Misskey';
			ui.trigger('title', '<i class="fa fa-sticky-note-o"></i>%i18n:mobile.tags.mk-post-page.submit%');

			Progress.start();

			this.refs.ui.refs.post.on('post-fetched', () => {
				Progress.set(0.5);
			});

			this.refs.ui.refs.post.on('loaded', () => {
				Progress.done();
			});
		});
	</script>
</mk-post-page>
