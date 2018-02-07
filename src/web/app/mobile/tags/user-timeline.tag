<mk-user-timeline>
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ withMedia ? '%i18n:mobile.tags.mk-user-timeline.no-posts-with-media%' : '%i18n:mobile.tags.mk-user-timeline.no-posts%' }/>
	<style lang="stylus" scoped>
		:scope
			display block
			max-width 600px
			margin 0 auto
	</style>
	<script lang="typescript">
		this.mixin('api');

		this.user = this.opts.user;
		this.withMedia = this.opts.withMedia;

		this.init = new Promise((res, rej) => {
			this.api('users/posts', {
				user_id: this.user.id,
				with_media: this.withMedia
			}).then(posts => {
				res(posts);
				this.trigger('loaded');
			});
		});

		this.more = () => {
			return this.api('users/posts', {
				user_id: this.user.id,
				with_media: this.withMedia,
				until_id: this.$refs.timeline.tail().id
			});
		};
	</script>
</mk-user-timeline>
