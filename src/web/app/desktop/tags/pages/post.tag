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
		import Progress from '../../../common/scripts/loading';

		this.post = this.opts.post;

		this.on('mount', () => {
			Progress.start();

			this.refs.ui.refs.detail.on('post-fetched', () => {
				Progress.set(0.5);
			});

			this.refs.ui.refs.detail.on('loaded', () => {
				Progress.done();
			});
		});
	</script>
</mk-post-page>
