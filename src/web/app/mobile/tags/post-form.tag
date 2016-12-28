mk-post-form
	header: div
		button.cancel(onclick={ cancel }): i.fa.fa-times
		div
			span.text-count(class={ over: refs.text.value.length > 300 }) { 300 - refs.text.value.length }
			button.submit(onclick={ post }) 投稿
	div.form
		mk-post-preview(if={ opts.reply }, post={ opts.reply })
		textarea@text(disabled={ wait }, oninput={ update }, onkeypress={ onkeypress }, onpaste={ onpaste }, placeholder={ opts.reply ? 'この投稿への返信...' : 'いまどうしてる？' })
		div.attaches(if={ files.length != 0 })
			ul.files@attaches
				li.file(each={ files })
					div.img(style='background-image: url({ url + "?thumbnail&size=64" })', title={ name })
				li.add(if={ files.length < 4 }, title='PCからファイルを添付', onclick={ select-file }): i.fa.fa-plus
		mk-uploader@uploader
		button@upload(onclick={ select-file }): i.fa.fa-upload
		button@drive(onclick={ select-file-from-drive }): i.fa.fa-cloud
		input@file(type='file', accept='image/*', multiple, onchange={ change-file })

style.
	display block
	padding-top 50px

	> header
		position fixed
		z-index 1000
		top 0
		left 0
		width 100%
		height 50px
		background #fff

		> div
			max-width 500px
			margin 0 auto

			> .cancel
				width 50px
				line-height 50px
				font-size 24px
				color #555

			> div
				position absolute
				top 0
				right 0

				> .text-count
					line-height 50px
					color #657786

				> .submit
					margin 8px
					padding 0 16px
					line-height 34px
					color $theme-color-foreground
					background $theme-color
					border-radius 4px

					&:disabled
						opacity 0.7

	> .form
		max-width 500px
		margin 0 auto

		> mk-post-preview
			padding 16px

		> .attaches

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

		> [ref='file']
			display none

		> [ref='text']
			display block
			padding 12px
			margin 0
			width 100%
			max-width 100%
			min-width 100%
			min-height 80px
			font-size 16px
			color #333
			border none
			border-bottom solid 1px #ddd
			border-radius 0

			&:disabled
				opacity 0.5

		> [ref='upload']
		> [ref='drive']
			display inline-block
			padding 0
			margin 0
			width 48px
			height 48px
			font-size 20px
			color #657786
			background transparent
			outline none
			border none
			border-radius 0
			box-shadow none

script.
	@mixin \api

	@wait = false
	@uploadings = []
	@files = []

	@on \mount ~>
		@refs.uploader.on \uploaded (file) ~>
			@add-file file

		@refs.uploader.on \change-uploads (uploads) ~>
			@trigger \change-uploading-files uploads

		@refs.text.focus!

	@onkeypress = (e) ~>
		if (e.char-code == 10 || e.char-code == 13) && e.ctrl-key
			@post!
		else
			return true

	@onpaste = (e) ~>
		data = e.clipboard-data
		items = data.items
		for i from 0 to items.length - 1
			item = items[i]
			switch (item.kind)
				| \file =>
					@upload item.get-as-file!
		return true

	@select-file = ~>
		@refs.file.click!

	@select-file-from-drive = ~>
		browser = document.body.append-child document.create-element \mk-drive-selector
		browser = riot.mount browser, do
			multiple: true
		.0
		browser.on \selected (files) ~>
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

	@post = ~>
		@wait = true

		files = if @files? and @files.length > 0
			then @files.map (f) -> f.id
			else undefined

		@api \posts/create do
			text: @refs.text.value
			media_ids: files
			reply_to_id: if @opts.reply? then @opts.reply.id else undefined
		.then (data) ~>
			@trigger \post
			@unmount!
		.catch (err) ~>
			console.error err
			#@opts.ui.trigger \notification 'Error!'
			@wait = false
			@update!

	@cancel = ~>
		@trigger \cancel
		@unmount!
