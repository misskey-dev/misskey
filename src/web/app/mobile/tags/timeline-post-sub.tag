<mk-timeline-post-sub>
	<article><a class="avatar-anchor" href={ '/' + post.user.username }><img class="avatar" src={ post.user.avatar_url + '?thumbnail&amp;size=96' } alt="avatar"/></a>
		<div class="main">
			<header><a class="name" href={ '/' + post.user.username }>{ post.user.name }</a><span class="username">@{ post.user.username }</span><a class="created-at" href={ '/' + post.user.username + '/' + post.id }>
					<mk-time time={ post.created_at }></mk-time></a></header>
			<div class="body">
				<mk-sub-post-content class="text" post={ post }></mk-sub-post-content>
			</div>
		</div>
	</article>
	<style type="stylus">
		:scope
			display block
			margin 0
			padding 0
			font-size 0.9em

			> article
				padding 16px

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
					margin 0 10px 0 0

					@media (min-width 500px)
						margin-right 16px

					> .avatar
						display block
						width 44px
						height 44px
						margin 0
						border-radius 8px
						vertical-align bottom

						@media (min-width 500px)
							width 52px
							height 52px

				> .main
					float left
					width calc(100% - 54px)

					@media (min-width 500px)
						width calc(100% - 68px)

					> header
						margin-bottom 4px
						white-space nowrap

						> .name
							display inline
							margin 0
							padding 0
							color #607073
							font-size 1em
							font-weight 700
							text-align left
							text-decoration none

							&:hover
								text-decoration underline

						> .username
							text-align left
							margin 0 0 0 8px
							color #d1d8da

						> .created-at
							position absolute
							top 0
							right 0
							color #b2b8bb

					> .body

						> .text
							cursor default
							margin 0
							padding 0
							font-size 1.1em
							color #717171

	</style>
	<script>@post = @opts.post</script>
</mk-timeline-post-sub>
