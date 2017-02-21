<mk-post-page>
	<mk-ui ref="ui">
		<main>
			<mk-post-detail ref="detail" post={ parent.post }></mk-post-detail>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

			main
				padding 16px

				> mk-post-detail
					margin 0 auto

	</style>
	<script>
		this.mixin('ui-progress');

		this.post = this.opts.post;

		this.on('mount', () => {
			this.Progress.start();

			this.refs.ui.refs.detail.on('post-fetched', () => {
				this.Progress.set(0.5);
			});

			this.refs.ui.refs.detail.on('loaded', () => {
				this.Progress.done();
			});
		});
	</script>
</mk-post-page>
