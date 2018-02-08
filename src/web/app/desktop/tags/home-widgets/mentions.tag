<mk-mentions-home-widget>
	<header><span data-is-active={ mode == 'all' } @click="setMode.bind(this, 'all')">すべて</span><span data-is-active={ mode == 'following' } @click="setMode.bind(this, 'following')">フォロー中</span></header>
	<div class="loading" v-if="isLoading">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="isEmpty">%fa:R comments%<span v-if="mode == 'all'">あなた宛ての投稿はありません。</span><span v-if="mode == 'following'">あなたがフォローしているユーザーからの言及はありません。</span></p>
	<mk-timeline ref="timeline">
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

			> header
				padding 8px 16px
				border-bottom solid 1px #eee

				> span
					margin-right 16px
					line-height 27px
					font-size 18px
					color #555

					&:not([data-is-active])
						color $theme-color
						cursor pointer

						&:hover
							text-decoration underline

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

		this.isLoading = true;
		this.isEmpty = false;
		this.moreLoading = false;
		this.mode = 'all';

		this.on('mount', () => {
			document.addEventListener('keydown', this.onDocumentKeydown);
			window.addEventListener('scroll', this.onScroll);

			this.fetch(() => this.trigger('loaded'));
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onDocumentKeydown);
			window.removeEventListener('scroll', this.onScroll);
		});

		this.onDocumentKeydown = e => {
			if (e.target.tagName != 'INPUT' && tag != 'TEXTAREA') {
				if (e.which == 84) { // t
					this.$refs.timeline.focus();
				}
			}
		};

		this.fetch = cb => {
			this.api('posts/mentions', {
				following: this.mode == 'following'
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
			this.api('posts/mentions', {
				following: this.mode == 'following',
				until_id: this.$refs.timeline.tail().id
			}).then(posts => {
				this.update({
					moreLoading: false
				});
				this.$refs.timeline.prependPosts(posts);
			});
		};

		this.onScroll = () => {
			const current = window.scrollY + window.innerHeight;
			if (current > document.body.offsetHeight - 8) this.more();
		};

		this.setMode = mode => {
			this.update({
				mode: mode
			});
			this.fetch();
		};
	</script>
</mk-mentions-home-widget>
