mk-big-follow-button
	button(if={ !init }, class={ wait: wait, follow: !user.is_following, unfollow: user.is_following },
			onclick={ onclick },
			disabled={ wait },
			title={ user.is_following ? 'フォロー解除' : 'フォローする' })
		span(if={ !wait && user.is_following })
			i.fa.fa-minus
			| フォロー解除
		span(if={ !wait && !user.is_following })
			i.fa.fa-plus
			| フォロー
		i.fa.fa-spinner.fa-pulse.fa-fw(if={ wait })
	div.init(if={ init }): i.fa.fa-spinner.fa-pulse.fa-fw

style.
	display block

	> button
	> .init
		display block
		cursor pointer
		padding 0
		margin 0
		width 100%
		line-height 38px
		font-size 1em
		outline none
		border-radius 4px

		*
			pointer-events none

		i
			margin-right 8px

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid rgba($theme-color, 0.3)
				border-radius 8px

		&.follow
			color #888
			background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
			border solid 1px #e2e2e2

			&:hover
				background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
				border-color #dcdcdc

			&:active
				background #ececec
				border-color #dcdcdc

		&.unfollow
			color $theme-color-foreground
			background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
			border solid 1px lighten($theme-color, 15%)

			&:not(:disabled)
				font-weight bold

			&:hover:not(:disabled)
				background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
				border-color $theme-color

			&:active:not(:disabled)
				background $theme-color
				border-color $theme-color

		&.wait
			cursor wait !important
			opacity 0.7

script.
	@mixin \api
	@mixin \is-promise
	@mixin \stream

	@user = null
	@user-promise = if @is-promise @opts.user then @opts.user else Promise.resolve @opts.user
	@init = true
	@wait = false

	@on \mount ~>
		@user-promise.then (user) ~>
			@user = user
			@init = false
			@update!
			@stream.on \follow @on-stream-follow
			@stream.on \unfollow @on-stream-unfollow

	@on \unmount ~>
		@stream.off \follow @on-stream-follow
		@stream.off \unfollow @on-stream-unfollow

	@on-stream-follow = (user) ~>
		if user.id == @user.id
			@user = user
			@update!

	@on-stream-unfollow = (user) ~>
		if user.id == @user.id
			@user = user
			@update!

	@onclick = ~>
		@wait = true
		if @user.is_following
			@api \following/delete do
				user_id: @user.id
			.then ~>
				@user.is_following = false
			.catch (err) ->
				console.error err
			.then ~>
				@wait = false
				@update!
		else
			@api \following/create do
				user_id: @user.id
			.then ~>
				@user.is_following = true
			.catch (err) ->
				console.error err
			.then ~>
				@wait = false
				@update!
