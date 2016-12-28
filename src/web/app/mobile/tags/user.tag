mk-user
	div.user(if={ !fetching })
		header
			div.banner(style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=1024)' : '' })
			div.body
				div.top
					a.avatar: img(src={ user.avatar_url + '?thumbnail&size=160' }, alt='avatar')
					mk-follow-button(if={ SIGNIN && I.id != user.id }, user={ user })

				div.title
					h1 { user.name }
					span.username @{ user.username }
					span.followed(if={ user.is_followed }) フォローされています

				div.bio { user.bio }

				div.info
					p.location(if={ user.location })
						i.fa.fa-map-marker
						| { user.location }

				div.friends
					a(href='{ user.username }/following')
						b { user.following_count }
						i フォロー
					a(href='{ user.username }/followers')
						b { user.followers_count }
						i フォロワー
			nav
				a(data-is-active={ page == 'posts' }, onclick={ go-posts }) 投稿
				a(data-is-active={ page == 'media' }, onclick={ go-media }) メディア
				a(data-is-active={ page == 'graphs' }, onclick={ go-graphs }) グラフ
				a(data-is-active={ page == 'likes' }, onclick={ go-likes }) いいね

		div.body
			mk-user-timeline(if={ page == 'posts' }, user={ user })
			mk-user-timeline(if={ page == 'media' }, user={ user }, with-media={ true })
			mk-user-graphs(if={ page == 'graphs' }, user={ user })

style.
	display block

	> .user
		> header
			> .banner
				padding-bottom 33.3%
				background-color #f5f5f5
				background-size cover
				background-position center

			> .body
				padding 8px
				margin 0 auto
				max-width 600px

				> .top
					&:after
						content ''
						display block
						clear both

					> .avatar
						display block
						float left
						width 25%
						height 40px

						> img
							display block
							position absolute
							left -2px
							bottom -2px
							width 100%
							border 2px solid #fff
							border-radius 6px

							@media (min-width 500px)
								left -4px
								bottom -4px
								border 4px solid #fff
								border-radius 12px

					> mk-follow-button
						float right
						height 40px

				> .title
					margin 8px 0

					> h1
						margin 0
						line-height 22px
						font-size 20px
						color #222

					> .username
						display inline-block
						line-height 20px
						font-size 16px
						font-weight bold
						color #657786

					> .followed
						margin-left 8px
						padding 2px 4px
						font-size 12px
						color #657786
						background #f8f8f8
						border-radius 4px

				> .bio
					margin 8px 0
					color #333

				> .info
					margin 8px 0

					> .location
						display inline
						margin 0
						color #555

						> i
							margin-right 4px

				> .friends
					> a
						color #657786

						&:first-child
							margin-right 16px

						> b
							margin-right 4px
							font-size 16px
							color #14171a

						> i
							font-size 14px

			> nav
				display flex
				justify-content center
				margin 0 auto
				max-width 600px
				border-bottom solid 1px #ddd

				> a
					display block
					flex 1 1
					text-align center
					line-height 52px
					font-size 14px
					text-decoration none
					color #657786
					border-bottom solid 2px transparent

					&[data-is-active]
						font-weight bold
						color $theme-color
						border-color $theme-color

		> .body
			@media (min-width 500px)
				padding 16px 0 0 0

script.
	@mixin \i
	@mixin \api

	@username = @opts.user
	@page = if @opts.page? then @opts.page else \posts
	@fetching = true

	@on \mount ~>
		@api \users/show do
			username: @username
		.then (user) ~>
			@fetching = false
			@user = user
			@trigger \loaded user
			@update!

	@go-posts = ~>
		@page = \posts
		@update!

	@go-media = ~>
		@page = \media
		@update!

	@go-graphs = ~>
		@page = \graphs
		@update!

	@go-likes = ~>
		@page = \likes
		@update!
