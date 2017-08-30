<mk-post-page>
	<mk-ui ref="ui">
		<main if={ !parent.fetching }>
			<a if={ parent.post.next } href={ parent.post.next }><i class="fa fa-angle-up"></i>%i18n:mobile.tags.mk-post-page.next%</a>
			<div>
				<mk-post-detail ref="post" post={ parent.post }/>
			</div>
			<a if={ parent.post.prev } href={ parent.post.prev }><i class="fa fa-angle-down"></i>%i18n:mobile.tags.mk-post-page.prev%</a>
		</main>
	</mk-ui>
	<style>
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

					> i
						margin-right 4px
	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.fetching = true;
		this.post = null;

		this.on('mount', () => {
			document.title = 'Misskey';
			ui.trigger('title', '<i class="fa fa-sticky-note-o"></i>%i18n:mobile.tags.mk-post-page.title%');
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
