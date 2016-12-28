mk-post-detail-sub(title={ title })
	a.avatar-anchor(href={ CONFIG.url + '/' + post.user.username })
		img.avatar(src={ post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar', data-user-preview={ post.user_id })
	div.main
		header
			div.left
				a.name(href={ CONFIG.url + '/' + post.user.username }, data-user-preview={ post.user_id })
					| { post.user.name }
				span.username
					| @{ post.user.username }
			div.right
				a.time(href={ url })
					mk-time(time={ post.created_at })
		div.body
			div.text@text
			div.media(if={ post.media })
				virtual(each={ file in post.media })
					img(src={ file.url + '?thumbnail&size=512' }, alt={ file.name }, title={ file.name })

style.
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
				word-wrap break-word
				font-size 1em
				color #717171

				> mk-url-preview
					margin-top 8px

			> .media
				> img
					display block
					max-width 100%

script.
	@mixin \api
	@mixin \text
	@mixin \date-stringify
	@mixin \user-preview

	@post = @opts.post

	@url = CONFIG.url + '/' + @post.user.username + '/' + @post.id

	@title = @date-stringify @post.created_at

	@on \mount ~>
		if @post.text?
			tokens = @analyze @post.text
			@refs.text.innerHTML = @compile tokens

			@refs.text.children.for-each (e) ~>
				if e.tag-name == \MK-URL
					riot.mount e

	@like = ~>
		if @post.is_liked
			@api \posts/likes/delete do
				post_id: @post.id
			.then ~>
				@post.is_liked = false
				@update!
		else
			@api \posts/likes/create do
				post_id: @post.id
			.then ~>
				@post.is_liked = true
				@update!
