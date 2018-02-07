<mk-post-preview>
	<article>
		<a class="avatar-anchor" href={ '/' + post.user.username }>
			<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="main">
			<header>
				<a class="name" href={ '/' + post.user.username }>{ post.user.name }</a>
				<span class="username">@{ post.user.username }</span>
				<a class="time" href={ '/' + post.user.username + '/' + post.id }>
					<mk-time time={ post.created_at }/>
				</a>
			</header>
			<div class="body">
				<mk-sub-post-content class="text" post={ post }/>
			</div>
		</div>
	</article>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 0
			font-size 0.9em
			background #fff

			> article
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
					margin 0 12px 0 0

					> .avatar
						display block
						width 48px
						height 48px
						margin 0
						border-radius 8px
						vertical-align bottom

				> .main
					float left
					width calc(100% - 60px)

					> header
						display flex
						margin-bottom 4px
						white-space nowrap

						> .name
							display block
							margin 0 .5em 0 0
							padding 0
							overflow hidden
							color #607073
							font-size 1em
							font-weight 700
							text-align left
							text-decoration none
							text-overflow ellipsis

							&:hover
								text-decoration underline

						> .username
							text-align left
							margin 0 .5em 0 0
							color #d1d8da

						> .time
							margin-left auto
							color #b2b8bb

					> .body

						> .text
							cursor default
							margin 0
							padding 0
							font-size 1.1em
							color #717171

	</style>
	<script lang="typescript">this.post = this.opts.post</script>
</mk-post-preview>
