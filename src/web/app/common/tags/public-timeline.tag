<mk-public-timeline>
	<inside-renderer each="{ posts }"></inside-renderer>
	<style>
		:scope

			display block
	</style>
	<script>
		this.mixin('api');

		this.posts = [];
		this.isFetching = true;

		this.on('mount', () => {
			this.api('posts', {
				limit: 5,
				include_reposts: false,
				include_replies: false
			}).then(posts => {
				this.update({
					isFetching: false,
					posts: posts
				});
			});
		});
	</script>
</mk-public-timeline>

<inside-renderer>
	<article>
		<img src={ user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div>
			<header>
				<span class="name">{ user.name }</span>
				<span class="username">@{ user.username }</span>
			</header>
			<div class="body">
				<div class="text" ref="text"></div>
			</div>
		</div>
	</article>
	<style>
		:scope
			display block

			> article
				padding 28px
				border-bottom solid 1px #eee

				&:last-child
					border-bottom none

				> img
					display block
					position absolute
					width 58px
					height 58px
					margin 0
					border-radius 100%
					vertical-align bottom

				> div
					min-height 58px
					padding-left 68px

					> header
						margin-bottom 2px

						> .name
							margin 0 .5em 0 0
							padding 0
							color #777

						> .username
							margin 0 .5em 0 0
							color #ccc

					> .body
						> .text
							cursor default
							display block
							margin 0
							padding 0
							overflow-wrap break-word
							font-size 1.1em
							color #717171

	</style>
	<script>
		import compile from '../../common/scripts/text-compiler';

		this.on('mount', () => {
			const text = compile(this.ast);
			this.refs.text.innerHTML = text;
		});
	</script>
</inside-renderer>
