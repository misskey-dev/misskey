<mk-post-page>
	<mk-ui ref="ui">
		<main v-if="!parent.fetching">
			<a v-if="parent.post.next" href={ parent.post.next }>%fa:angle-up%%i18n:desktop.tags.mk-post-page.next%</a>
			<mk-post-detail ref="detail" post={ parent.post }/>
			<a v-if="parent.post.prev" href={ parent.post.prev }>%fa:angle-down%%i18n:desktop.tags.mk-post-page.prev%</a>
		</main>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block

			main
				padding 16px
				text-align center

				> a
					display inline-block

					&:first-child
						margin-bottom 4px

					&:last-child
						margin-top 4px

					> [data-fa]
						margin-right 4px

				> mk-post-detail
					margin 0 auto
					width 640px

	</style>
	<script lang="typescript">
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.fetching = true;
		this.post = null;

		this.on('mount', () => {
			Progress.start();

			this.api('posts/show', {
				post_id: this.opts.post
			}).then(post => {

				this.update({
					fetching: false,
					post: post
				});

				Progress.done();
			});
		});
	</script>
</mk-post-page>
