mk-photo-stream-home-widget
	p.title
		i.fa.fa-camera
		| フォトストリーム
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
	@mixin \stream

	@images = []
	@initializing = true

	@on \mount ~>
		@stream.on \drive_file_created @on-stream-drive-file-created

		@api \drive/stream do
			type: 'image/*'
			limit: 9images
		.then (images) ~>
			@initializing = false
			@images = images
			@update!

	@on \unmount ~>
		@stream.off \drive_file_created @on-stream-drive-file-created

	@on-stream-drive-file-created = (file) ~>
		if /^image\/.+$/.test file.type
			@images.unshift file
			if @images.length > 9
				@images.pop!
			@update!
