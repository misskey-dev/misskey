mk-user-preview
	virtual(if={ user != null })
		div.banner(style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=512)' : '' })
		a.avatar(href={ CONFIG.url + '/' + user.username }, target='_blank'): img(src={ user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.title
			p.name { user.name }
			p.username @{ user.username }
		div.bio { user.bio }
		div.status
			div
				p 投稿
				a { user.posts_count }
			div
				p フォロー
				a { user.following_count }
			div
				p フォロワー
				a { user.followers_count }
		mk-follow-button(if={ SIGNIN && user.id != I.id }, user={ user-promise })

style.
	display block
	position absolute
	z-index 2048
	width 250px
	background #fff
	background-clip content-box
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 4px
	overflow hidden

	// https://github.com/riot/riot/issues/2081
	> virtual
		display block
		position relative

		> .banner
			height 84px
			background-color #f5f5f5
			background-size cover
			background-position center

		> .avatar
			display block
			position absolute
			top 62px
			left 13px

			> img
				display block
				width 58px
				height 58px
				margin 0
				border solid 3px #fff
				border-radius 8px

		> .title
			display block
			padding 8px 0 8px 85px

			> .name
				display block
				margin 0
				font-weight bold
				line-height 16px
				color #656565

			> .username
				display block
				margin 0
				line-height 16px
				font-size 0.8em
				color #999

		> .bio
			padding 0 16px
			font-size 0.7em
			color #555

		> .status
			padding 8px 16px

			> div
				display inline-block
				width 33%

				> p
					margin 0
					font-size 0.7em
					color #aaa

				> a
					font-size 1em
					color $theme-color

		> mk-follow-button
			position absolute
			top 92px
			right 8px

script.
	@mixin \i
	@mixin \api

	@u = @opts.user
	@user = null
	@user-promise =
		if typeof @u == \string
			new Promise (resolve, reject) ~>
				@api \users/show do
					user_id: if @u.0 == \@ then undefined else @u
					username: if @u.0 == \@ then @u.substr 1 else undefined
				.then (user) ~>
					resolve user
		else
			Promise.resolve @u

	@on \mount ~>
		@user-promise.then (user) ~>
			@user = user
			@update!

		Velocity @root, {
			opacity: 0
			'margin-top': \-8px
		} 0ms
		Velocity @root, {
			opacity: 1
			'margin-top': 0
		} {
			duration: 200ms
			easing: \ease-out
		}

	@close = ~>
		Velocity @root, {
			opacity: 0
			'margin-top': \-8px
		} {
			duration: 200ms
			easing: \ease-out
			complete: ~> @unmount!
		}
