mk-follow-button
	button(if={ !init }, class={ wait: wait, follow: !user.is_following, unfollow: user.is_following },
			onclick={ onclick },
			disabled={ wait })
		i.fa.fa-minus(if={ !wait && user.is_following })
		i.fa.fa-plus(if={ !wait && !user.is_following })
		i.fa.fa-spinner.fa-pulse.fa-fw(if={ wait })
		| { user.is_following ? 'フォロー解除' : 'フォロー' }
	div.init(if={ init }): i.fa.fa-spinner.fa-pulse.fa-fw

style.
	display block

	> button
	> .init
		display block
		user-select none
		cursor pointer
		padding 0 16px
		margin 0
		height inherit
		font-size 16px
		outline none
		border solid 1px $theme-color
		border-radius 4px

		*
			pointer-events none

		&.follow
			color $theme-color
			background transparent

			&:hover
				background rgba($theme-color, 0.1)

			&:active
				background rgba($theme-color, 0.2)

		&.unfollow
			color $theme-color-foreground
			background $theme-color

		&.wait
			cursor wait !important
			opacity 0.7

		&.init
			cursor wait !important
			opacity 0.7

		> i
			margin-right 4px

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
