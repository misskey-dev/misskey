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
		this.mixin('ui');
		this.mixin('ui-progress');

		this.post = this.opts.post;

		this.on('mount', () => {
			document.title = 'Misskey';
			this.ui.trigger('title', '<i class="fa fa-sticky-note-o"></i>投稿');

			this.Progress.start();

			this.refs.ui.refs.post.on('post-fetched', () => {
				this.Progress.set(0.5);
			});

			this.refs.ui.refs.post.on('loaded', () => {
				this.Progress.done();
			});
		});
	</script>
</mk-post-page>
