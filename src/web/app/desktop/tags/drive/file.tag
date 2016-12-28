mk-drive-browser-file(data-is-selected={ (file._selected || false).toString() }, data-is-contextmenu-showing={ is-contextmenu-showing.toString() }, onclick={ onclick }, oncontextmenu={ oncontextmenu }, draggable='true', ondragstart={ ondragstart }, ondragend={ ondragend }, title={ title })
	div.label(if={ I.avatar_id == file.id })
		img(src='/_/resources/label.svg')
		p アバター
	div.label(if={ I.banner_id == file.id })
		img(src='/_/resources/label.svg')
		p バナー
	div.label(if={ I.data.wallpaper == file.id })
		img(src='/_/resources/label.svg')
		p 壁紙
	div.thumbnail: img(src={ file.url + '?thumbnail&size=128' }, alt='')
	p.name
		span { file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }
		span.ext(if={ file.name.lastIndexOf('.') != -1 }) { file.name.substr(file.name.lastIndexOf('.')) }

style.
	display block
	margin 4px
	padding 8px 0 0 0
	width 144px
	height 180px
	border-radius 4px

	&, *
		cursor pointer

	&:hover
		background rgba(0, 0, 0, 0.05)

		> .label
			&:before
			&:after
				background #0b65a5

	&:active
		background rgba(0, 0, 0, 0.1)

		> .label
			&:before
			&:after
				background #0b588c

	&[data-is-selected='true']
		background $theme-color

		&:hover
			background lighten($theme-color, 10%)

		&:active
			background darken($theme-color, 10%)

		> .label
			&:before
			&:after
				display none

		> .name
			color $theme-color-foreground

	&[data-is-contextmenu-showing='true']
		&:after
			content ""
			pointer-events none
			position absolute
			top -4px
			right -4px
			bottom -4px
			left -4px
			border 2px dashed rgba($theme-color, 0.3)
			border-radius 4px

	> .label
		position absolute
		top 0
		left 0
		pointer-events none

		&:before
			content ""
			display block
			position absolute
			z-index 1
			top 0
			left 57px
			width 28px
			height 8px
			background #0c7ac9

		&:after
			content ""
			display block
			position absolute
			z-index 1
			top 57px
			left 0
			width 8px
			height 28px
			background #0c7ac9

		> img
			position absolute
			z-index 2
			top 0
			left 0

		> p
			position absolute
			z-index 3
			top 19px
			left -28px
			width 120px
			margin 0
			text-align center
			line-height 28px
			color #fff
			transform rotate(-45deg)

	> .thumbnail
		width 128px
		height 128px
		left 8px

		> img
			display block
			position absolute
			top 0
			left 0
			right 0
			bottom 0
			margin auto
			max-width 128px
			max-height 128px
			pointer-events none

	> .name
		display block
		margin 4px 0 0 0
		font-size 0.8em
		text-align center
		word-break break-all
		color #444
		overflow hidden

		> .ext
			opacity 0.5

script.
	@mixin \i
	@mixin \bytes-to-size

	@file = @opts.file
	@browser = @parent

	@title = @file.name + '\n' + @file.type + ' ' + (@bytes-to-size @file.datasize)

	@is-contextmenu-showing = false

	@onclick = ~>
		if @browser.multiple
			if @file._selected?
				@file._selected = !@file._selected
			else
				@file._selected = true
			@browser.trigger \change-selection @browser.get-selection!
		else
			if @file._selected
				@browser.trigger \selected @file
			else
				@browser.files.for-each (file) ~>
					file._selected = false
				@file._selected = true
				@browser.trigger \change-selection @file

	@oncontextmenu = (e) ~>
		e.prevent-default!
		e.stop-immediate-propagation!

		@is-contextmenu-showing = true
		@update!
		ctx = document.body.append-child document.create-element \mk-drive-browser-file-contextmenu
		ctx = riot.mount ctx, do
			browser: @browser
			file: @file
		ctx = ctx.0
		ctx.open do
			x: e.page-x - window.page-x-offset
			y: e.page-y - window.page-y-offset
		ctx.on \closed ~>
			@is-contextmenu-showing = false
			@update!
		return false

	@ondragstart = (e) ~>
		e.data-transfer.effect-allowed = \move
		e.data-transfer.set-data 'text' JSON.stringify do
			type: \file
			id: @file.id
			file: @file
		@is-dragging = true

		# 親ブラウザに対して、ドラッグが開始されたフラグを立てる
		# (=あなたの子供が、ドラッグを開始しましたよ)
		@browser.is-drag-source = true

	@ondragend = (e) ~>
		@is-dragging = false
		@browser.is-drag-source = false
