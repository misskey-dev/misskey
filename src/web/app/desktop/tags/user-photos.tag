mk-user-photos
	p.title
		i.fa.fa-camera
		| フォト
	p.initializing(if={ initializing })
		i.fa.fa-spinner.fa-pulse.fa-fw
		| 読み込んでいます
		mk-ellipsis
	div.stream(if={ !initializing && images.length > 0 })
		virtual(each={ image in images })
			div.img(style={ 'background-image: url(' + image.url + '?thumbnail&size=256)' })
	p.empty(if={ !initializing && images.length == 0 })
		| 写真はありません

style.
	display block
	background #fff

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> i
			margin-right 4px

	> .stream
		display -webkit-flex
		display -moz-flex
		display -ms-flex
		display flex
		justify-content center
		flex-wrap wrap
		padding 8px

		> .img
			flex 1 1 33%
			width 33%
			height 80px
			background-position center center
			background-size cover
			background-clip content-box
			border solid 2px transparent

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

script.
	@mixin \api
	@mixin \is-promise

	@images = []
	@initializing = true

	@user = null
	@user-promise = if @is-promise @opts.user then @opts.user else Promise.resolve @opts.user

	@on \mount ~>
		@user-promise.then (user) ~>
			@user = user
			@update!

			@api \users/posts do
				user_id: @user.id
				with_media: true
				limit: 9posts
			.then (posts) ~>
				@initializing = false
				posts.for-each (post) ~>
					post.media.for-each (image) ~>
						if @images.length < 9
							@images.push image
				@update!
