mk-drive
	nav
		p(onclick={ go-root })
			i.fa.fa-cloud
			| ドライブ
		virtual(each={ folder in hierarchy-folders })
			span: i.fa.fa-angle-right
			p(onclick={ _move }) { folder.name }
		span(if={ folder != null }): i.fa.fa-angle-right
		p(if={ folder != null }) { folder.name }
	div.browser(if={ file == null }, class={ loading: loading })
		div.folders(if={ folders.length > 0 })
			virtual(each={ folder in folders })
				mk-drive-folder(folder={ folder })
			p(if={ more-folders })
				| もっと読み込む
		div.files(if={ files.length > 0 })
			virtual(each={ file in files })
				mk-drive-file(file={ file })
			p(if={ more-files })
				| もっと読み込む
		div.empty(if={ files.length == 0 && folders.length == 0 && !loading })
			p(if={ !folder == null })
				| ドライブには何もありません。
			p(if={ folder != null })
				| このフォルダーは空です
		div.loading(if={ loading }).
			<div class="spinner">
				<div class="dot1"></div>
				<div class="dot2"></div>
			</div>
	mk-drive-file-viewer(if={ file != null }, file={ file })

style.
	display block
	background #fff

	> nav
		display block
		width 100%
		padding 10px 12px
		overflow auto
		white-space nowrap
		font-size 0.9em
		color #555
		background #fff
		border-bottom solid 1px #dfdfdf

		> p
			display inline
			margin 0
			padding 0

			&:last-child
				font-weight bold

			> i
				margin-right 4px

		> span
			margin 0 8px
			opacity 0.5

	> .browser
		&.loading
			opacity 0.5

		> .folders
			> mk-drive-folder
				border-bottom solid 1px #eee

		> .files
			> mk-drive-file
				border-bottom solid 1px #eee

		> .empty
			padding 16px
			text-align center
			color #999
			pointer-events none

			> p
				margin 0

		> .loading
			.spinner
				margin 100px auto
				width 40px
				height 40px
				text-align center

				animation sk-rotate 2.0s infinite linear

			.dot1, .dot2
				width 60%
				height 60%
				display inline-block
				position absolute
				top 0
				background-color rgba(0, 0, 0, 0.3)
				border-radius 100%

				animation sk-bounce 2.0s infinite ease-in-out

			.dot2
				top auto
				bottom 0
				animation-delay -1.0s

			@keyframes sk-rotate { 100% { transform: rotate(360deg); }}

			@keyframes sk-bounce {
				0%, 100% {
					transform: scale(0.0);
				} 50% {
					transform: scale(1.0);
				}
			}

script.
	@mixin \api
	@mixin \stream

	@files = []
	@folders = []
	@hierarchy-folders = []
	@selected-files = []

	# 現在の階層(フォルダ)
	# * null でルートを表す
	@folder = null

	@file = null

	@is-select-mode = @opts.select? and @opts.select
	@multiple = if @opts.multiple? then @opts.multiple else false

	@on \mount ~>
		@stream.on \drive_file_created @on-stream-drive-file-created
		@stream.on \drive_file_updated @on-stream-drive-file-updated
		@stream.on \drive_folder_created @on-stream-drive-folder-created
		@stream.on \drive_folder_updated @on-stream-drive-folder-updated

		# Riotのバグでnullを渡しても""になる
		# https://github.com/riot/riot/issues/2080
		#if @opts.folder?
		if @opts.folder? and @opts.folder != ''
			@cd @opts.folder
		else
			@load!

	@on \unmount ~>
		@stream.off \drive_file_created @on-stream-drive-file-created
		@stream.off \drive_file_updated @on-stream-drive-file-updated
		@stream.off \drive_folder_created @on-stream-drive-folder-created
		@stream.off \drive_folder_updated @on-stream-drive-folder-updated

	@on-stream-drive-file-created = (file) ~>
		@add-file file, true

	@on-stream-drive-file-updated = (file) ~>
		current = if @folder? then @folder.id else null
		if current != file.folder_id
			@remove-file file
		else
			@add-file file, true

	@on-stream-drive-folder-created = (folder) ~>
		@add-folder folder, true

	@on-stream-drive-folder-updated = (folder) ~>
		current = if @folder? then @folder.id else null
		if current != folder.parent_id
			@remove-folder folder
		else
			@add-folder folder, true

	@_move = (ev) ~>
		@move ev.item.folder

	@move = (target-folder) ~>
		@cd target-folder, true

	@cd = (target-folder, is-move) ~>
		if target-folder? and typeof target-folder == \object
			target-folder = target-folder.id

		if target-folder == null
			@go-root!
			return

		@loading = true
		@update!

		@api \drive/folders/show do
			folder_id: target-folder
		.then (folder) ~>
			@folder = folder
			@hierarchy-folders = []

			x = (f) ~>
				@hierarchy-folders.unshift f
				if f.parent?
					x f.parent

			if folder.parent?
				x folder.parent

			@update!
			if is-move then @trigger \move @folder
			@trigger \cd @folder
			@load!
		.catch (err, text-status) ->
			console.error err

	@add-folder = (folder, unshift = false) ~>
		current = if @folder? then @folder.id else null
		if current != folder.parent_id
			return

		if (@folders.some (f) ~> f.id == folder.id)
			return

		if unshift
			@folders.unshift folder
		else
			@folders.push folder

		@update!

	@add-file = (file, unshift = false) ~>
		current = if @folder? then @folder.id else null
		if current != file.folder_id
			return

		if (@files.some (f) ~> f.id == file.id)
			exist = (@files.map (f) -> f.id).index-of file.id
			@files[exist] = file
			@update!
			return

		if unshift
			@files.unshift file
		else
			@files.push file

		@update!

	@remove-folder = (folder) ~>
		if typeof folder == \object
			folder = folder.id
		@folders = @folders.filter (f) -> f.id != folder
		@update!

	@remove-file = (file) ~>
		if typeof file == \object
			file = file.id
		@files = @files.filter (f) -> f.id != file
		@update!

	@go-root = ~>
		if @folder != null
			@folder = null
			@hierarchy-folders = []
			@update!
			@trigger \move-root
			@load!

	@load = ~>
		@folders = []
		@files = []
		@more-folders = false
		@more-files = false
		@loading = true
		@update!

		@trigger \begin-load

		load-folders = null
		load-files = null

		folders-max = 20
		files-max = 20

		# フォルダ一覧取得
		@api \drive/folders do
			folder_id: if @folder? then @folder.id else null
			limit: folders-max + 1
		.then (folders) ~>
			if folders.length == folders-max + 1
				@more-folders = true
				folders.pop!
			load-folders := folders
			complete!
		.catch (err, text-status) ~>
			console.error err

		# ファイル一覧取得
		@api \drive/files do
			folder_id: if @folder? then @folder.id else null
			limit: files-max + 1
		.then (files) ~>
			if files.length == files-max + 1
				@more-files = true
				files.pop!
			load-files := files
			complete!
		.catch (err, text-status) ~>
			console.error err

		flag = false
		complete = ~>
			if flag
				load-folders.for-each (folder) ~>
					@add-folder folder
				load-files.for-each (file) ~>
					@add-file file
				@loading = false
				@update!

				@trigger \loaded
			else
				flag := true
				@trigger \load-mid

	@choose-file = (file) ~>
		if @is-select-mode
			exist = @selected-files.some (f) ~> f.id == file.id
			if exist
				@selected-files = (@selected-files.filter (f) ~> f.id != file.id)
			else
				@selected-files.push file
			@update!
			@trigger \change-selected @selected-files
		else
			@file = file
			@update!
			@trigger \open-file @file
