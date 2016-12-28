mk-following-setuper
	p.title 気になるユーザーをフォロー:
	div.users(if={ !loading && users.length > 0 })
		div.user(each={ users })
			a.avatar-anchor(href={ CONFIG.url + '/' + username })
				img.avatar(src={ avatar_url + '?thumbnail&size=42' }, alt='', data-user-preview={ id })
			div.body
				a.name(href={ CONFIG.url + '/' + username }, target='_blank', data-user-preview={ id }) { name }
				p.username @{ username }
			mk-follow-button(user={ this })
	p.empty(if={ !loading && users.length == 0 })
		| おすすめのユーザーは見つかりませんでした。
	p.loading(if={ loading })
		i.fa.fa-spinner.fa-pulse.fa-fw
		| 読み込んでいます
		mk-ellipsis
	a.refresh(onclick={ refresh }) もっと見る
	button.close(onclick={ close }, title='閉じる'): i.fa.fa-times

style.
	display block
	padding 24px
	background #fff

	> .title
		margin 0 0 12px 0
		font-size 1em
		font-weight bold
		color #888

	> .users
		&:after
			content ""
			display block
			clear both

		> .user
			padding 16px
			width 238px
			float left

			&:after
				content ""
				display block
				clear both

			> .avatar-anchor
				display block
				float left
				margin 0 12px 0 0

				> .avatar
					display block
					width 42px
					height 42px
					margin 0
					border-radius 8px
					vertical-align bottom

			> .body
				float left
				width calc(100% - 54px)

				> .name
					margin 0
					font-size 16px
					line-height 24px
					color #555

				> .username
					margin 0
					font-size 15px
					line-height 16px
					color #ccc

			> mk-follow-button
				position absolute
				top 16px
				right 16px

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .loading
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

	> .refresh
		display block
		margin 0 8px 0 0
		text-align right
		font-size 0.9em
		color #999

	> .close
		cursor pointer
		display block
		position absolute
		top 6px
		right 6px
		z-index 1
		margin 0
		padding 0
		font-size 1.2em
		color #999
		border none
		outline none
		background transparent

		&:hover
			color #555

		&:active
			color #222

		> i
			padding 14px

script.
	@mixin \api
	@mixin \user-preview

	@users = null
	@loading = true

	@limit = 6users
	@page = 0

	@on \mount ~>
		@load!

	@load = ~>
		@loading = true
		@users = null
		@update!

		@api \users/recommendation do
			limit: @limit
			offset: @limit * @page
		.then (users) ~>
			@loading = false
			@users = users
			@update!
		.catch (err, text-status) ->
			console.error err

	@refresh = ~>
		if @users.length < @limit
			@page = 0
		else
			@page++
		@load!

	@close = ~>
		@unmount!
