<mk-timeline>
	<virtual each={ post, i in posts }>
		<mk-timeline-post post={ post }></mk-timeline-post>
		<p class="date" if={ i != posts.length - 1 && post._date != posts[i + 1]._date }><span><i class="fa fa-angle-up"></i>{ post._datetext }</span><span><i class="fa fa-angle-down"></i>{ posts[i + 1]._datetext }</span></p>
	</virtual>
	<footer data-yield="footer">
		<yield from="footer"/>
	</footer>
	<style>
		:scope
			display block

			> mk-timeline-post
				border-bottom solid 1px #eaeaea

				&:first-child
					border-top-left-radius 6px
					border-top-right-radius 6px

				&:last-of-type
					border-bottom none

			> .date
				display block
				margin 0
				line-height 32px
				font-size 14px
				text-align center
				color #aaa
				background #fdfdfd
				border-bottom solid 1px #eaeaea

				span
					margin 0 16px

				i
					margin-right 8px

			> footer
				padding 16px
				text-align center
				color #ccc
				border-top solid 1px #eaeaea
				border-bottom-left-radius 4px
				border-bottom-right-radius 4px

	</style>
	<script>
		this.posts = [];

		this.on('update', () => {
			this.posts.forEach(post => {
				const date = new Date(post.created_at).getDate();
				const month = new Date(post.created_at).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
			});
		});

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

		this.clear = () => {
			this.posts = [];
			this.update();
		};

		this.focus = () => {
			this.root.children[0].focus();
		};

	</script>
</mk-timeline>
