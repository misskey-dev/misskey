<mk-post-detail-sub title={ title }>
	<a class="avatar-anchor" href={ '/' + post.user.username }>
		<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar" data-user-preview={ post.user_id }/>
	</a>
	<div class="main">
		<header>
			<div class="left">
				<a class="name" href={ '/' + post.user.username } data-user-preview={ post.user_id }>{ post.user.name }</a>
				<span class="username">@{ post.user.username }</span>
			</div>
			<div class="right">
				<a class="time" href={ '/' + post.user.username + '/' + post.id }>
					<mk-time time={ post.created_at }/>
				</a>
			</div>
		</header>
		<div class="body">
			<div class="text" ref="text"></div>
			<div class="media" v-if="post.media">
				<mk-images images={ post.media }/>
			</div>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 20px 32px
			background #fdfdfd

			&:after
				content ""
				display block
				clear both

			&:hover
				> .main > footer > button
					color #888

			> .avatar-anchor
				display block
				float left
				margin 0 16px 0 0

				> .avatar
					display block
					width 44px
					height 44px
					margin 0
					border-radius 4px
					vertical-align bottom

			> .main
				float left
				width calc(100% - 60px)

				> header
					margin-bottom 4px
					white-space nowrap

					&:after
						content ""
						display block
						clear both

					> .left
						float left

						> .name
							display inline
							margin 0
							padding 0
							color #777
							font-size 1em
							font-weight 700
							text-align left
							text-decoration none

							&:hover
								text-decoration underline

						> .username
							text-align left
							margin 0 0 0 8px
							color #ccc

					> .right
						float right

						> .time
							font-size 0.9em
							color #c0c0c0

				> .body

					> .text
						cursor default
						display block
						margin 0
						padding 0
						overflow-wrap break-word
						font-size 1em
						color #717171

						> mk-url-preview
							margin-top 8px

	</style>
	<script lang="typescript">
		import compile from '../../common/scripts/text-compiler';
		import dateStringify from '../../common/scripts/date-stringify';

		this.mixin('api');
		this.mixin('user-preview');

		this.post = this.opts.post;
		this.title = dateStringify(this.post.created_at);

		this.on('mount', () => {
			if (this.post.text) {
				const tokens = this.post.ast;

				this.$refs.text.innerHTML = compile(tokens);

				Array.from(this.$refs.text.children).forEach(e => {
					if (e.tagName == 'MK-URL') riot.mount(e);
				});
			}
		});

		this.like = () => {
			if (this.post.is_liked) {
				this.api('posts/likes/delete', {
					post_id: this.post.id
				}).then(() => {
					this.post.is_liked = false;
					this.update();
				});
			} else {
				this.api('posts/likes/create', {
					post_id: this.post.id
				}).then(() => {
					this.post.is_liked = true;
					this.update();
				});
			}
		};
	</script>
</mk-post-detail-sub>
