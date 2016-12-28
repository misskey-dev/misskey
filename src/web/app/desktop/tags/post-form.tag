mk-post-form(ondragover={ ondragover }, ondragenter={ ondragenter }, ondragleave={ ondragleave }, ondrop={ ondrop })
	textarea@text(disabled={ wait }, class={ withfiles: files.length != 0 }, oninput={ update }, onkeydown={ onkeydown }, onpaste={ onpaste }, placeholder={ opts.reply ? 'この投稿への返信...' : 'いまどうしてる？' })
	div.attaches(if={ files.length != 0 })
		ul.files@attaches
			li.file(each={ files })
				div.img(style='background-image: url({ url + "?thumbnail&size=64" })', title={ name })
				img.remove(onclick={ _remove }, src='/_/resources/desktop/remove.png', title='添付取り消し', alt='')
			li.add(if={ files.length < 4 }, title='PCからファイルを添付', onclick={ select-file }): i.fa.fa-plus
		p.remain
			| 残り{ 4 - files.length }
	mk-uploader@uploader
	button@upload(title='PCからファイルを添付', onclick={ select-file }): i.fa.fa-upload
	button@drive(title='ドライブからファイルを添付', onclick={ select-file-from-drive }): i.fa.fa-cloud
	p.text-count(class={ over: refs.text.value.length > 300 }) のこり{ 300 - refs.text.value.length }文字
	button@submit(class={ wait: wait }, disabled={ wait || (refs.text.value.length == 0 && files.length == 0) }, onclick={ post })
		| { wait ? '投稿中' : opts.reply ? '返信' : '投稿' }
		mk-ellipsis(if={ wait })
	input@file(type='file', accept='image/*', multiple, tabindex='-1', onchange={ change-file })
	div.dropzone(if={ draghover })

style.
	display block
	padding 16px
	background lighten($theme-color, 95%)

	&:after
		content ""
		display block
		clear both

	> .attaches
		margin 0
		padding 0
		background lighten($theme-color, 98%)
		border solid 1px rgba($theme-color, 0.1)
		border-top none
		border-radius 0 0 4px 4px
		transition border-color .3s ease

		> .remain
			display block
			position absolute
			top 8px
			right 8px
			margin 0
			padding 0
			color rgba($theme-color, 0.4)

		> .files
			display block
			margin 0
			padding 4px
			list-style none

			&:after
				content ""
				display block
				clear both

			> .file
				display block
				float left
				margin 4px
				padding 0
				cursor move

				&:hover > .remove
					display block

				> .img
					width 64px
					height 64px
					background-size cover
					background-position center center

				> .remove
					display none
					position absolute
					top -6px
					right -6px
					width 16px
					height 16px
					cursor pointer

			> .add
				display block
				float left
				margin 4px
				padding 0
				border dashed 2px rgba($theme-color, 0.2)
				cursor pointer

				&:hover
					border-color rgba($theme-color, 0.3)

					> i
						color rgba($theme-color, 0.4)

				> i
					display block
					width 60px
					height 60px
					line-height 60px
					text-align center
					font-size 1.2em
					color rgba($theme-color, 0.2)

	> mk-uploader
		margin 8px 0 0 0
		padding 8px
		border solid 1px rgba($theme-color, 0.2)
		border-radius 4px

	[ref='file']
		display none

	[ref='text']
		display block
		padding 12px
		margin 0
		width 100%
		max-width 100%
		min-width 100%
		min-height calc(16px + 12px + 12px)
		font-size 16px
		color #333
		background #fff
		outline none
		border solid 1px rgba($theme-color, 0.1)
		border-radius 4px
		transition border-color .3s ease

		&:hover
			border-color rgba($theme-color, 0.2)
			transition border-color .1s ease

		&:focus
			color $theme-color
			border-color rgba($theme-color, 0.5)
			transition border-color 0s ease

		&:disabled
			opacity 0.5

		&::-webkit-input-placeholder
			color rgba($theme-color, 0.3)

		&.withfiles
			border-bottom solid 1px rgba($theme-color, 0.1) !important
			border-radius 4px 4px 0 0

			&:hover + .attaches
				border-color rgba($theme-color, 0.2)
				transition border-color .1s ease

			&:focus + .attaches
				border-color rgba($theme-color, 0.5)
				transition border-color 0s ease

	.text-count
		pointer-events none
		display block
		position absolute
		bottom 16px
		right 138px
		margin 0
		line-height 40px
		color rgba($theme-color, 0.5)

		&.over
			color #ec3828

	[ref='submit']
		display block
		position absolute
		bottom 16px
		right 16px
		cursor pointer
		padding 0
		margin 0
		width 110px
		height 40px
		font-size 1em
		color $theme-color-foreground
		background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
		outline none
		border solid 1px lighten($theme-color, 15%)
		border-radius 4px

		&:not(:disabled)
			font-weight bold

		&:hover:not(:disabled)
			background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
			border-color $theme-color

		&:active:not(:disabled)
			background $theme-color
			border-color $theme-color

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

		&:disabled
			opacity 0.7
			cursor default

		&.wait
			background linear-gradient(
				45deg,
				darken($theme-color, 10%) 25%,
				$theme-color              25%,
				$theme-color              50%,
				darken($theme-color, 10%) 50%,
				darken($theme-color, 10%) 75%,
				$theme-color              75%,
				$theme-color
			)
			background-size 32px 32px
			animation stripe-bg 1.5s linear infinite
			opacity 0.7
			cursor wait

			@keyframes stripe-bg
				from {background-position: 0 0;}
				to   {background-position: -64px 32px;}

	[ref='upload']
	[ref='drive']
		display inline-block
		cursor pointer
		padding 0
		margin 8px 4px 0 0
		width 40px
		height 40px
		font-size 1em
		color rgba($theme-color, 0.5)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color rgba($theme-color, 0.3)

		&:active
			color rgba($theme-color, 0.6)
			background linear-gradient(to bottom, lighten($theme-color, 80%) 0%, lighten($theme-color, 90%) 100%)
			border-color rgba($theme-color, 0.5)
			box-shadow 0 2px 4px rgba(0, 0, 0, 0.15) inset

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

	> .dropzone
		position absolute
		left 0
		top 0
		width 100%
		height 100%
		border dashed 2px rgba($theme-color, 0.5)
		pointer-events none

script.
	@mixin \api
	@mixin \notify
	@mixin \autocomplete
	@mixin \sortable

	@wait = false
	@uploadings = []
	@files = []
	@autocomplete = null

	@in-reply-to-post = @opts.reply

	# https://github.com/riot/riot/issues/2080
	if @in-reply-to-post == '' then @in-reply-to-post = null

	@on \mount ~>
		@refs.uploader.on \uploaded (file) ~>
			@add-file file

		@refs.uploader.on \change-uploads (uploads) ~>
			@trigger \change-uploading-files uploads

		@autocomplete = new @Autocomplete @refs.text
		@autocomplete.attach!

	@on \unmount ~>
		@autocomplete.detach!

	@focus = ~>
		@refs.text.focus!

	@clear = ~>
		@refs.text.value = ''
		@files = []
		@trigger \change-files
		@update!

	@ondragover = (e) ~>
		e.stop-propagation!
		@draghover = true
		# ドラッグされてきたものがファイルだったら
		if e.data-transfer.effect-allowed == \all
			e.data-transfer.drop-effect = \copy
		else
			e.data-transfer.drop-effect = \move
		return false

	@ondragenter = (e) ~>
		@draghover = true

	@ondragleave = (e) ~>
		@draghover = false

	@ondrop = (e) ~>
		e.prevent-default!
		e.stop-propagation!
		@draghover = false

		# ファイルだったら
		if e.data-transfer.files.length > 0
			Array.prototype.for-each.call e.data-transfer.files, (file) ~>
				@upload file
			return false

		# データ取得
		data = e.data-transfer.get-data 'text'
		if !data?
			return false

		try
			# パース
			obj = JSON.parse data

			# (ドライブの)ファイルだったら
			if obj.type == \file
				@add-file obj.file
		catch
			# ignore

		return false

	@onkeydown = (e) ~>
		if (e.which == 10 || e.which == 13) && (e.ctrl-key || e.meta-key)
			@post!

	@onpaste = (e) ~>
		data = e.clipboard-data
		items = data.items
		for i from 0 to items.length - 1
			item = items[i]
			switch (item.kind)
				| \file =>
					@upload item.get-as-file!

	@select-file = ~>
		@refs.file.click!

	@select-file-from-drive = ~>
		browser = document.body.append-child document.create-element \mk-select-file-from-drive-window
		i = riot.mount browser, do
			multiple: true
		i[0].one \selected (files) ~>
			files.for-each @add-file

	@change-file = ~>
		files = @refs.file.files
		for i from 0 to files.length - 1
			file = files.item i
			@upload file

	@upload = (file) ~>
		@refs.uploader.upload file

	@add-file = (file) ~>
		file._remove = ~>
			@files = @files.filter (x) -> x.id != file.id
			@trigger \change-files @files
			@update!

		@files.push file
		@trigger \change-files @files
		@update!

		new @Sortable @refs.attaches, do
			draggable: \.file
			animation: 150ms

	@post = (e) ~>
		@wait = true

		files = if @files? and @files.length > 0
			then @files.map (f) -> f.id
			else undefined

		@api \posts/create do
			text: @refs.text.value
			media_ids: files
			reply_to_id: if @in-reply-to-post? then @in-reply-to-post.id else undefined
		.then (data) ~>
			@trigger \post
			@notify if @in-reply-to-post? then '返信しました！' else '投稿しました！'
		.catch (err) ~>
			console.error err
			@notify '投稿できませんでした'
		.then ~>
			@wait = false
			@update!
