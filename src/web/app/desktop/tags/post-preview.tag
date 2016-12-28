mk-post-preview(title={ title })
	article
		a.avatar-anchor(href={ CONFIG.url + '/' + post.user.username })
			img.avatar(src={ post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar', data-user-preview={ post.user_id })
		div.main
			header
				a.name(href={ CONFIG.url + '/' + post.user.username }, data-user-preview={ post.user_id })
					| { post.user.name }
				span.username
					| @{ post.user.username }
				a.time(href={ CONFIG.url + '/' + post.user.username + '/' + post.id })
					mk-time(time={ post.created_at })
			div.body
				mk-sub-post-content.text(post={ post })

style.
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
			margin 0 16px 0 0

			> .avatar
				display block
				width 52px
				height 52px
				margin 0
				border-radius 8px
				vertical-align bottom

		> .main
			float left
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

				> .time
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

script.
	@mixin \date-stringify
	@mixin \user-preview

	@post = @opts.post

	@title = @date-stringify @post.created_at
