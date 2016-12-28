mk-user-recommendation-home-widget
	p.title
		i.fa.fa-users
		| おすすめユーザー
	button(onclick={ refresh }, title='他を見る'): i.fa.fa-refresh
	div.user(if={ !loading && users.length != 0 }, each={ _user in users })
		a.avatar-anchor(href={ CONFIG.url + '/' + _user.username })
			img.avatar(src={ _user.avatar_url + '?thumbnail&size=42' }, alt='', data-user-preview={ _user.id })
		div.body
			a.name(href={ CONFIG.url + '/' + _user.username }, data-user-preview={ _user.id }) { _user.name }
			p.username @{ _user.username }
		mk-follow-button(user={ _user })
	p.empty(if={ !loading && users.length == 0 })
		| いません！
	p.loading(if={ loading })
		i.fa.fa-spinner.fa-pulse.fa-fw
		| 読み込んでいます
		mk-ellipsis

style.
	display block
	background #fff

	> .title
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		border-bottom solid 1px #eee

		> i
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .user
		padding 16px
		border-bottom solid 1px #eee

		&:last-child
			border-bottom none

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
				display block
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

script.
	@mixin \api
	@mixin \user-preview

	@users = null
	@loading = true

	@limit = 3users
	@page = 0

	@on \mount ~>
		@fetch!
		@clock = set-interval ~>
			if @users.length < @limit
				@fetch true
		, 60000ms

	@on \unmount ~>
		clear-interval @clock

	@fetch = (quiet = false) ~>
		@loading = true
		@users = null
		if not quiet then @update!
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
		@fetch!
