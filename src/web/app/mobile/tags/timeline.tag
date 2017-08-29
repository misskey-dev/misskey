<mk-timeline>
	<div class="init" if={ init }>
		<i class="fa fa-spinner fa-pulse"></i>%i18n:common.loading%
	</div>
	<div class="empty" if={ !init && posts.length == 0 }>
		<i class="fa fa-comments-o"></i>{ opts.empty || '%i18n:mobile.tags.mk-timeline.empty%' }
	</div>
	<virtual each={ post, i in posts }>
		<mk-timeline-post post={ post }/>
		<p class="date" if={ i != posts.length - 1 && post._date != posts[i + 1]._date }>
			<span><i class="fa fa-angle-up"></i>{ post._datetext }</span>
			<span><i class="fa fa-angle-down"></i>{ posts[i + 1]._datetext }</span>
		</p>
	</virtual>
	<footer if={ !init }>
		<button if={ canFetchMore } onclick={ more } disabled={ fetching }>
			<span if={ !fetching }>%i18n:mobile.tags.mk-timeline.load-more%</span>
			<span if={ fetching }>%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</footer>
	<style>
		:scope
			display block
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			> .init
				padding 64px 0
				text-align center
				color #999

				> i
					margin-right 4px

			> .empty
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

			> mk-timeline-post
				border-bottom solid 1px #eaeaea

				&:first-child
					border-radius 8px 8px 0 0

				&:last-of-type
					border-bottom none

			> .date
				display block
				margin 0
				line-height 32px
				text-align center
				font-size 0.9em
				color #aaa
				background #fdfdfd
				border-bottom solid 1px #eaeaea

				span
					margin 0 16px

				i
					margin-right 8px

			> footer
				text-align center
				border-top solid 1px #eaeaea
				border-bottom-left-radius 4px
				border-bottom-right-radius 4px

				> button
					margin 0
					padding 16px
					width 100%
					color $theme-color
					border-radius 0 0 8px 8px

					&:disabled
						opacity 0.7

	</style>
	<script>
		this.posts = [];
		this.init = true;
		this.fetching = false;
		this.canFetchMore = true;

		this.on('mount', () => {
			this.opts.init.then(posts => {
				this.init = false;
				this.setPosts(posts);
			});
		});

		this.on('update', () => {
			this.posts.forEach(post => {
				const date = new Date(post.created_at).getDate();
				const month = new Date(post.created_at).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
			});
		});

		this.more = () => {
			if (this.init || this.fetching || this.posts.length == 0) return;
			this.update({
				fetching: true
			});
			this.opts.more().then(posts => {
				this.fetching = false;
				this.prependPosts(posts);
			});
		};

		this.setPosts = posts => {
			this.update({
				posts: posts
			});
		};

		this.prependPosts = posts => {
			posts.forEach(post => {
				this.posts.push(post);
				this.update();
			});
		}

		this.addPost = post => {
			this.posts.unshift(post);
			this.update();
		};

		this.tail = () => {
			return this.posts[this.posts.length - 1];
		};
	</script>
</mk-timeline>
