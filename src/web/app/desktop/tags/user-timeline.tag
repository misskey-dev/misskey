<mk-user-timeline>
	<header>
		<span data-is-active={ mode == 'default' } @click="setMode.bind(this, 'default')">投稿</span><span data-is-active={ mode == 'with-replies' } @click="setMode.bind(this, 'with-replies')">投稿と返信</span>
	</header>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" if={ isEmpty }>%fa:R comments%このユーザーはまだ何も投稿していないようです。</p>
	<mk-timeline ref="timeline">
		<yield to="footer">
			<virtual if={ !parent.moreLoading }>%fa:moon%</virtual>
			<virtual if={ parent.moreLoading }>%fa:spinner .pulse .fw%</virtual>
		</yield/>
	</mk-timeline>
	<style lang="stylus" scoped>
		:scope
			display block
			background #fff

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
	<script>
		import isPromise from '../../common/scripts/is-promise';

		this.mixin('api');

		this.user = null;
		this.userPromise = isPromise(this.opts.user)
			? this.opts.user
			: Promise.resolve(this.opts.user);
		this.isLoading = true;
		this.isEmpty = false;
		this.moreLoading = false;
		this.unreadCount = 0;
		this.mode = 'default';

		this.on('mount', () => {
			document.addEventListener('keydown', this.onDocumentKeydown);
			window.addEventListener('scroll', this.onScroll);

			this.userPromise.then(user => {
				this.update({
					user: user
				});

				this.fetch(() => this.trigger('loaded'));
			});
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onDocumentKeydown);
			window.removeEventListener('scroll', this.onScroll);
		});

		this.onDocumentKeydown = e => {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
				if (e.which == 84) { // [t]
					this.$refs.timeline.focus();
				}
			}
		};

		this.fetch = cb => {
			this.api('users/posts', {
				user_id: this.user.id,
				until_date: this.date ? this.date.getTime() : undefined,
				with_replies: this.mode == 'with-replies'
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
			this.api('users/posts', {
				user_id: this.user.id,
				with_replies: this.mode == 'with-replies',
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
			if (current > document.body.offsetHeight - 16/*遊び*/) {
				this.more();
			}
		};

		this.setMode = mode => {
			this.update({
				mode: mode
			});
			this.fetch();
		};

		this.warp = date => {
			this.update({
				date: date
			});

			this.fetch();
		};
	</script>
</mk-user-timeline>
