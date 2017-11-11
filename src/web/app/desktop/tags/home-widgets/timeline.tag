<mk-timeline-home-widget>
	<mk-following-setuper if={ noFollowing }/>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" if={ isEmpty }><i class="fa fa-comments-o"></i>自分の投稿や、自分がフォローしているユーザーの投稿が表示されます。</p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if={ !parent.moreLoading }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ parent.moreLoading }></i></yield/>
	<style>
		:scope
			display block
			background #fff

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

				> i
					display block
					margin-bottom 16px
					font-size 3em
					color #ccc

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('stream');

		this.isLoading = true;
		this.isEmpty = false;
		this.moreLoading = false;
		this.noFollowing = this.I.following_count == 0;

		this.on('mount', () => {
			this.stream.on('post', this.onStreamPost);
			this.stream.on('follow', this.onStreamFollow);
			this.stream.on('unfollow', this.onStreamUnfollow);

			document.addEventListener('keydown', this.onDocumentKeydown);
			window.addEventListener('scroll', this.onScroll);

			this.load(() => this.trigger('loaded'));
		});

		this.on('unmount', () => {
			this.stream.off('post', this.onStreamPost);
			this.stream.off('follow', this.onStreamFollow);
			this.stream.off('unfollow', this.onStreamUnfollow);

			document.removeEventListener('keydown', this.onDocumentKeydown);
			window.removeEventListener('scroll', this.onScroll);
		});

		this.onDocumentKeydown = e => {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					this.refs.timeline.focus();
				}
			}
		};

		this.load = (cb) => {
			this.update({
				isLoading: true
			});

			this.api('posts/timeline', {
				max_date: this.date ? this.date.getTime() : undefined
			}).then(posts => {
				this.update({
					isLoading: false,
					isEmpty: posts.length == 0
				});
				this.refs.timeline.setPosts(posts);
				if (cb) cb();
			});
		};

		this.more = () => {
			if (this.moreLoading || this.isLoading || this.refs.timeline.posts.length == 0) return;
			this.update({
				moreLoading: true
			});
			this.api('posts/timeline', {
				max_id: this.refs.timeline.tail().id
			}).then(posts => {
				this.update({
					moreLoading: false
				});
				this.refs.timeline.prependPosts(posts);
			});
		};

		this.onStreamPost = post => {
			this.update({
				isEmpty: false
			});
			this.refs.timeline.addPost(post);
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
			console.log(date);

			this.update({
				date: date
			});

			this.load();
		};
	</script>
</mk-timeline-home-widget>
