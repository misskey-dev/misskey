<mk-timeline-home-widget>
	<mk-following-setuper v-if="noFollowing"/>
	<div class="loading" v-if="isLoading">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="isEmpty && !isLoading">%fa:R comments%自分の投稿や、自分がフォローしているユーザーの投稿が表示されます。</p>
	<mk-timeline ref="timeline" hide={ isLoading }>
		<yield to="footer">
			<template v-if="!parent.moreLoading">%fa:moon%</template>
			<template v-if="parent.moreLoading">%fa:spinner .pulse .fw%</template>
		</yield/>
	</mk-timeline>
	<style lang="stylus" scoped>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> mk-following-setuper
				border-bottom solid 1px #eee

			> .loading
				padding 64px 0

			> .empty
				display block
				margin 0 auto
				padding 32px
				max-width 400px
				text-align center
				color #999

				> [data-fa]
					display block
					margin-bottom 16px
					font-size 3em
					color #ccc

	</style>
	<script lang="typescript">
		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.isLoading = true;
		this.isEmpty = false;
		this.moreLoading = false;
		this.noFollowing = this.I.following_count == 0;

		this.on('mount', () => {
			this.connection.on('post', this.onStreamPost);
			this.connection.on('follow', this.onStreamFollow);
			this.connection.on('unfollow', this.onStreamUnfollow);

			document.addEventListener('keydown', this.onDocumentKeydown);
			window.addEventListener('scroll', this.onScroll);

			this.load(() => this.$emit('loaded'));
		});

		this.on('unmount', () => {
			this.connection.off('post', this.onStreamPost);
			this.connection.off('follow', this.onStreamFollow);
			this.connection.off('unfollow', this.onStreamUnfollow);
			this.stream.dispose(this.connectionId);

			document.removeEventListener('keydown', this.onDocumentKeydown);
			window.removeEventListener('scroll', this.onScroll);
		});

		this.onDocumentKeydown = e => {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					this.$refs.timeline.focus();
				}
			}
		};

		this.load = (cb) => {
			this.update({
				isLoading: true
			});

			this.api('posts/timeline', {
				until_date: this.date ? this.date.getTime() : undefined
			}).then(posts => {
				this.update({
					isLoading: false,
					isEmpty: posts.length == 0
				});
				this.$refs.timeline.setPosts(posts);
				if (cb) cb();
			});
		};

		this.more = () => {
			if (this.moreLoading || this.isLoading || this.$refs.timeline.posts.length == 0) return;
			this.update({
				moreLoading: true
			});
			this.api('posts/timeline', {
				until_id: this.$refs.timeline.tail().id
			}).then(posts => {
				this.update({
					moreLoading: false
				});
				this.$refs.timeline.prependPosts(posts);
			});
		};

		this.onStreamPost = post => {
			this.update({
				isEmpty: false
			});
			this.$refs.timeline.addPost(post);
		};

		this.onStreamFollow = () => {
			this.load();
		};

		this.onStreamUnfollow = () => {
			this.load();
		};

		this.onScroll = () => {
			const current = window.scrollY + window.innerHeight;
			if (current > document.body.offsetHeight - 8) this.more();
		};

		this.warp = date => {
			this.update({
				date: date
			});

			this.load();
		};
	</script>
</mk-timeline-home-widget>
