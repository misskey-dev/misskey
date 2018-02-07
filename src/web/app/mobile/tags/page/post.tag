<mk-post-page>
	<mk-ui ref="ui">
		<main v-if="!parent.fetching">
			<a v-if="parent.post.next" href={ parent.post.next }>%fa:angle-up%%i18n:mobile.tags.mk-post-page.next%</a>
			<div>
				<mk-post-detail ref="post" post={ parent.post }/>
			</div>
			<a v-if="parent.post.prev" href={ parent.post.prev }>%fa:angle-down%%i18n:mobile.tags.mk-post-page.prev%</a>
		</main>
	</mk-ui>
	<style lang="stylus" scoped>
		:scope
			display block

			main
				text-align center

				> div
					margin 8px auto
					padding 0
					max-width 500px
					width calc(100% - 16px)

					@media (min-width 500px)
						margin 16px auto
						width calc(100% - 32px)

				> a
					display inline-block

					&:first-child
						margin-top 8px

						@media (min-width 500px)
							margin-top 16px

					&:last-child
						margin-bottom 8px

						@media (min-width 500px)
							margin-bottom 16px

					> [data-fa]
						margin-right 4px

	</style>
	<script lang="typescript">
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.fetching = true;
		this.post = null;

		this.on('mount', () => {
			document.title = 'Misskey';
			ui.trigger('title', '%fa:R sticky-note%%i18n:mobile.tags.mk-post-page.title%');
			document.documentElement.style.background = '#313a42';

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
