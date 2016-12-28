mk-messaging
	div.search
			div.form
				label(for='search-input')
					i.fa.fa-search
				input@search-input(type='search', oninput={ search }, placeholder='ユーザーを探す')
			div.result
				ol.users(if={ search-result.length > 0 })
					li(each={ user in search-result })
						a(onclick={ user._click })
							img.avatar(src={ user.avatar_url + '?thumbnail&size=32' }, alt='')
							span.name { user.name }
							span.username @{ user.username }
	div.main
		div.history(if={ history.length > 0 })
			virtual(each={ history })
				a.user(data-is-me={ is_me }, data-is-read={ is_read }, onclick={ _click }): div
					img.avatar(src={ (is_me ? recipient.avatar_url : user.avatar_url) + '?thumbnail&size=64' }, alt='')
					header
						span.name { is_me ? recipient.name : user.name }
						span.username { '@' + (is_me ? recipient.username : user.username ) }
						mk-time(time={ created_at })
					div.body
						p.text
							span.me(if={ is_me }) あなた:
							| { text }
		p.no-history(if={ history.length == 0 })
			| 履歴はありません。
			br
			| ユーザーを検索して、いつでもメッセージを送受信できます。

style.
	display block

	> .search
		display block
		position absolute
		top 0
		left 0
		z-index 1
		width 100%
		background #fff
		box-shadow 0 0px 2px rgba(0, 0, 0, 0.2)

		> .form
			padding 8px
			background #f7f7f7

			> label
				display block
				position absolute
				top 0
				left 8px
				z-index 1
				height 100%
				width 38px
				pointer-events none

				> i
					display block
					position absolute
					top 0
					right 0
					bottom 0
					left 0
					width 1em
					height 1em
					margin auto
					color #555

			> input
				margin 0
				padding 0 12px 0 38px
				width 100%
				font-size 1em
				line-height 38px
				color #000
				outline none
				border solid 1px #eee
				border-radius 5px
				box-shadow none
				transition color 0.5s ease, border 0.5s ease

				&:hover
					border solid 1px #ddd
					transition border 0.2s ease

				&:focus
					color darken($theme-color, 20%)
					border solid 1px $theme-color
					transition color 0, border 0

		> .result
			display block
			top 0
			left 0
			z-index 2
			width 100%
			margin 0
			padding 0
			background #fff

			> .users
				margin 0
				padding 0
				list-style none

				> li
					> a
						display inline-block
						z-index 1
						width 100%
						padding 8px 32px
						vertical-align top
						white-space nowrap
						overflow hidden
						color rgba(0, 0, 0, 0.8)
						text-decoration none
						transition none

						&:hover
							color #fff
							background $theme-color

							.name
								color #fff

							.username
								color #fff

						&:active
							color #fff
							background darken($theme-color, 10%)

							.name
								color #fff

							.username
								color #fff

						.avatar
							vertical-align middle
							min-width 32px
							min-height 32px
							max-width 32px
							max-height 32px
							margin 0 8px 0 0
							border-radius 6px

						.name
							margin 0 8px 0 0
							/*font-weight bold*/
							font-weight normal
							color rgba(0, 0, 0, 0.8)

						.username
							font-weight normal
							color rgba(0, 0, 0, 0.3)

	> .main
		padding-top 56px

		> .history

			> a
				display block
				padding 20px 30px
				text-decoration none
				background #fff
				border-bottom solid 1px #eee

				*
					pointer-events none
					user-select none

				&:hover
					background #fafafa

					> .avatar
						filter saturate(200%)

				&:active
					background #eee

				&[data-is-read]
				&[data-is-me]
					opacity 0.8

				&:not([data-is-me]):not([data-is-read])
					background-image url("/_/resources/desktop/unread.svg")
					background-repeat no-repeat
					background-position 0 center

				&:after
					content ""
					display block
					clear both

				> div
					max-width 500px
					margin 0 auto

					> header
						margin-bottom 2px
						white-space nowrap
						overflow hidden

						> .name
							text-align left
							display inline
							margin 0
							padding 0
							font-size 1em
							color rgba(0, 0, 0, 0.9)
							font-weight bold
							transition all 0.1s ease

						> .username
							text-align left
							margin 0 0 0 8px
							color rgba(0, 0, 0, 0.5)

						> mk-time
							position absolute
							top 0
							right 0
							display inline
							color rgba(0, 0, 0, 0.5)
							font-size small

					> .avatar
						float left
						width 54px
						height 54px
						margin 0 16px 0 0
						border-radius 8px
						transition all 0.1s ease

					> .body

						> .text
							display block
							margin 0 0 0 0
							padding 0
							overflow hidden
							word-wrap break-word
							font-size 1.1em
							color rgba(0, 0, 0, 0.8)

							.me
								color rgba(0, 0, 0, 0.4)

						> .image
							display block
							max-width 100%
							max-height 512px

		> .no-history
			margin 0
			padding 2em 1em
			text-align center
			color #999
			font-weight 500

script.
	@mixin \i
	@mixin \api

	@search-result = []

	@on \mount ~>
		@api \messaging/history
		.then (history) ~>
			@is-loading = false
			history.for-each (message) ~>
				message.is_me = message.user_id == @I.id
				message._click = ~>
					if message.is_me
						@trigger \navigate-user message.recipient
					else
						@trigger \navigate-user message.user
			@history = history
			@update!
		.catch (err) ~>
			console.error err

	@search = ~>
		q = @refs.search-input.value
		if q == ''
			@search-result = []
		else
			@api \users/search do
				query: q
			.then (users) ~>
				users.for-each (user) ~>
					user._click = ~>
						@trigger \navigate-user user
						@search-result = []
				@search-result = users
				@update!
			.catch (err) ~>
				console.error err
