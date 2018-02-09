<mk-home-timeline>
	<mk-init-following v-if="noFollowing" />
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ '%i18n:mobile.tags.mk-home-timeline.empty-timeline%' }/>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-init-following
				margin-bottom 8px

	</style>
	<script lang="typescript">
		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.noFollowing = this.I.following_count == 0;

		this.init = new Promise((res, rej) => {
			this.api('posts/timeline').then(posts => {
				res(posts);
				this.$emit('loaded');
			});
		});

		this.fetch = () => {
			this.api('posts/timeline').then(posts => {
				this.$refs.timeline.setPosts(posts);
			});
		};

		this.on('mount', () => {
			this.connection.on('post', this.onStreamPost);
			this.connection.on('follow', this.onStreamFollow);
			this.connection.on('unfollow', this.onStreamUnfollow);
		});

		this.on('unmount', () => {
			this.connection.off('post', this.onStreamPost);
			this.connection.off('follow', this.onStreamFollow);
			this.connection.off('unfollow', this.onStreamUnfollow);
			this.stream.dispose(this.connectionId);
		});

		this.more = () => {
			return this.api('posts/timeline', {
				until_id: this.$refs.timeline.tail().id
			});
		};

		this.onStreamPost = post => {
			this.update({
				isEmpty: false
			});
			this.$refs.timeline.addPost(post);
		};

		this.onStreamFollow = () => {
			this.fetch();
		};

		this.onStreamUnfollow = () => {
			this.fetch();
		};
	</script>
</mk-home-timeline>
