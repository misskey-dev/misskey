<mk-drive-browser>
	<nav>
		<div class="path" oncontextmenu={ pathOncontextmenu }>
			<mk-drive-browser-nav-folder class={ current: folder == null } folder={ null }></mk-drive-browser-nav-folder>
			<virtual each={ folder in hierarchyFolders }><span class="separator"><i class="fa fa-angle-right"></i></span>
				<mk-drive-browser-nav-folder folder={ folder }></mk-drive-browser-nav-folder>
			</virtual><span class="separator" if={ folder != null }><i class="fa fa-angle-right"></i></span><span class="folder current" if={ folder != null }>{ folder.name }</span>
		</div>
		<input class="search" type="search" placeholder="&#xf002; 検索"/>
	</nav>
	<div class="main { uploading: uploads.length > 0, loading: loading }" ref="main" onmousedown={ onmousedown } ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop } oncontextmenu={ oncontextmenu }>
		<div class="selection" ref="selection"></div>
		<div class="contents" ref="contents">
			<div class="folders" ref="foldersContainer" if={ folders.length > 0 }>
				<virtual each={ folder in folders }>
					<mk-drive-browser-folder class="folder" folder={ folder }></mk-drive-browser-folder>
				</virtual>
				<button if={ moreFolders }>もっと読み込む</button>
			</div>
			<div class="files" ref="filesContainer" if={ files.length > 0 }>
				<virtual each={ file in files }>
					<mk-drive-browser-file class="file" file={ file }></mk-drive-browser-file>
				</virtual>
				<button if={ moreFiles }>もっと読み込む</button>
			</div>
			<div class="empty" if={ files.length == 0 && folders.length == 0 && !loading }>
				<p if={ draghover }>ドロップですか？いいですよ、ボクはカワイイですからね</p>
				<p if={ !draghover && folder == null }><strong>ドライブには何もありません。</strong><br/>右クリックして「ファイルをアップロード」を選んだり、ファイルをドラッグ&ドロップすることでもアップロードできます。</p>
				<p if={ !draghover && folder != null }>このフォルダーは空です</p>
			</div>
		</div>
		<div class="loading" if={ loading }>
			<div class="spinner">
				<div class="dot1"></div>
				<div class="dot2"></div>
			</div>
		</div>
	</div>
	<div class="dropzone" if={ draghover }></div>
	<mk-uploader ref="uploader"></mk-uploader>
	<input ref="fileInput" type="file" accept="*/*" multiple="multiple" tabindex="-1" onchange={ changeFileInput }/>
	<style>
		:scope
			display block

			> nav
				display block
				z-index 2
				width 100%
				overflow auto
				font-size 0.9em
				color #555
				background #fff
				//border-bottom 1px solid #dfdfdf
				box-shadow 0 1px 0 rgba(0, 0, 0, 0.05)

				&, *
					user-select none

				> .path
					display inline-block
					vertical-align bottom
					margin 0
					padding 0 8px
					width calc(100% - 200px)
					line-height 38px
					white-space nowrap

					> *
						display inline-block
						margin 0
						padding 0 8px
						line-height 38px
						cursor pointer

						i
							margin-right 4px

						*
							pointer-events none

						&:hover
							text-decoration underline

						&.current
							font-weight bold
							cursor default

							&:hover
								text-decoration none

						&.separator
							margin 0
							padding 0
							opacity 0.5
							cursor default

							> i
								margin 0

				> .search
					display inline-block
					vertical-align bottom
					user-select text
					cursor auto
					margin 0
					padding 0 18px
					width 200px
					font-size 1em
					line-height 38px
					background transparent
					outline none
					//border solid 1px #ddd
					border none
					border-radius 0
					box-shadow none
					transition color 0.5s ease, border 0.5s ease
					font-family FontAwesome, sans-serif

					&[data-active='true']
						background #fff

					&::-webkit-input-placeholder,
					&:-ms-input-placeholder,
					&:-moz-placeholder
						color $ui-controll-foreground-color

			> .main
				padding 8px
				height calc(100% - 38px)
				overflow auto

				&, *
					user-select none

				&.loading
					cursor wait !important

					*
						pointer-events none

					> .contents
						opacity 0.5

				&.uploading
					height calc(100% - 38px - 100px)

				> .selection
					display none
					position absolute
					z-index 128
					top 0
					left 0
					border solid 1px $theme-color
					background rgba($theme-color, 0.5)
					pointer-events none

				> .contents

					> .folders
						&:after
							content ""
							display block
							clear both

						> .folder
							float left

					> .files
						&:after
							content ""
							display block
							clear both

						> .file
							float left

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

			> .dropzone
				position absolute
				left 0
				top 38px
				width 100%
				height calc(100% - 38px)
				border dashed 2px rgba($theme-color, 0.5)
				pointer-events none

			> mk-uploader
				height 100px
				padding 16px
				background #fff

			> input
				display none

	</style>
	<script>
		this.mixin('api');
		this.mixin('dialog');
		this.mixin('input-dialog');
		this.mixin('stream');

		this.files = [];
		this.folders = [];
		this.hierarchyFolders = [];

		this.uploads = [];

		// 現在の階層(フォルダ)
		// * null でルートを表す
		this.folder = null;

		this.multiple = if this.opts.multiple? then this.opts.multiple else false

		// ドロップされようとしているか
		this.draghover = false;

		// 自信の所有するアイテムがドラッグをスタートさせたか
		// (自分自身の階層にドロップできないようにするためのフラグ)
		this.is-drag-source = false;

		this.on('mount', () => {
			this.refs.uploader.on('uploaded', (file) => {
				@add-file file, true

			this.refs.uploader.on('change-uploads', (uploads) => {
				this.uploads = uploads
				this.update();

			this.stream.on 'drive_file_created' this.on-stream-drive-file-created
			this.stream.on 'drive_file_updated' this.on-stream-drive-file-updated
			this.stream.on 'drive_folder_created' this.on-stream-drive-folder-created
			this.stream.on 'drive_folder_updated' this.on-stream-drive-folder-updated

			// Riotのバグでnullを渡しても""になる
			// https://github.com/riot/riot/issues/2080
			#if this.opts.folder?
			if this.opts.folder? and this.opts.folder != ''
				@move this.opts.folder
			else
				@load!

		this.on('unmount', () => {
			this.stream.off 'drive_file_created' this.on-stream-drive-file-created
			this.stream.off 'drive_file_updated' this.on-stream-drive-file-updated
			this.stream.off 'drive_folder_created' this.on-stream-drive-folder-created
			this.stream.off 'drive_folder_updated' this.on-stream-drive-folder-updated

		this.on-stream-drive-file-created = (file) => {
			@add-file file, true

		this.on-stream-drive-file-updated = (file) => {
			current = if this.folder? then this.folder.id else null
			if current != file.folder_id
				@remove-file file
			else
				@add-file file, true

		this.on-stream-drive-folder-created = (folder) => {
			@add-folder folder, true

		this.on-stream-drive-folder-updated = (folder) => {
			current = if this.folder? then this.folder.id else null
			if current != folder.parent_id
				@remove-folder folder
			else
				@add-folder folder, true

		this.onmousedown = (e) => {
			if (contains this.refs.folders-container, e.target) or (contains this.refs.files-container, e.target)
				return true

			rect = this.refs.main.get-bounding-client-rect!

			left = e.pageX + this.refs.main.scroll-left - rect.left - window.pageXOffset
			top = e.pageY + this.refs.main.scroll-top - rect.top - window.pageYOffset

			move = (e) =>
				this.refs.selection.style.display = 'block' 

				cursorX = e.pageX + this.refs.main.scroll-left - rect.left - window.pageXOffset
				cursorY = e.pageY + this.refs.main.scroll-top - rect.top - window.pageYOffset
				w = cursorX - left
				h = cursorY - top

				if w > 0
					this.refs.selection.style.width = w + 'px' 
					this.refs.selection.style.left = left + 'px' 
				else
					this.refs.selection.style.width = -w + 'px' 
					this.refs.selection.style.left = cursorX + 'px' 

				if h > 0
					this.refs.selection.style.height = h + 'px' 
					this.refs.selection.style.top = top + 'px' 
				else
					this.refs.selection.style.height = -h + 'px' 
					this.refs.selection.style.top = cursorY + 'px' 

			up = (e) =>
				document.document-element.removeEventListener 'mousemove' move
				document.document-element.removeEventListener 'mouseup' up

				this.refs.selection.style.display = 'none' 

			document.document-element.addEventListener 'mousemove' move
			document.document-element.addEventListener 'mouseup' up

		this.path-oncontextmenu = (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();
			return false

		this.ondragover = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// ドラッグ元が自分自身の所有するアイテムかどうか
			if !@is-drag-source
				// ドラッグされてきたものがファイルだったら
				if e.dataTransfer.effectAllowed == 'all' 
					e.dataTransfer.dropEffect = 'copy' 
				else
					e.dataTransfer.dropEffect = 'move' 
				this.draghover = true
			else
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none' 
			return false

		this.ondragenter = (e) => {
			e.preventDefault();
			if !@is-drag-source
				this.draghover = true

		this.ondragleave = (e) => {
			this.draghover = false

		this.ondrop = (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.draghover = false

			// ドロップされてきたものがファイルだったら
			if e.dataTransfer.files.length > 0
				Array.prototype.forEach.call e.dataTransfer.files, (file) =>
					@upload file, this.folder
				return false

			// データ取得
			data = e.dataTransfer.get-data 'text'
			if !data?
				return false

			// パース
			obj = JSON.parse data

			// (ドライブの)ファイルだったら
			if obj.type == 'file' 
				file = obj.id
				if (this.files.some (f) => f.id == file)
					return false
				@remove-file file
				this.api('drive/files/update', {
					file_id: file
					folder_id: if this.folder? then this.folder.id else null
				}).then(() => {
					// something
				.catch (err, text-status) =>
					console.error err

			// (ドライブの)フォルダーだったら
			else if obj.type == 'folder' 
				folder = obj.id
				// 移動先が自分自身ならreject
				if this.folder? and folder == this.folder.id
					return false
				if (this.folders.some (f) => f.id == folder)
					return false
				@remove-folder folder
				this.api('drive/folders/update', {
					folder_id: folder
					parent_id: if this.folder? then this.folder.id else null
				}).then(() => {
					// something
				.catch (err) =>
					if err == 'detected-circular-definition'
						@dialog do
							'<i class="fa fa-exclamation-triangle"></i>操作を完了できません'
							'移動先のフォルダーは、移動するフォルダーのサブフォルダーです。'
							[
								text: 'OK' 
							]

			return false

		this.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			ctx = document.body.appendChild(document.createElement('mk-drive-browser-base-contextmenu'));
 			ctx = riot.mount ctx, do
				browser: this
			ctx = ctx.0
			ctx.open do
				x: e.pageX - window.pageXOffset
				y: e.pageY - window.pageYOffset

			return false

		this.select-local-file = () => {
			this.refs.file-input.click();

		this.url-upload = () => {
			url <~ @input-dialog do
				'URLアップロード'
				'アップロードしたいファイルのURL'
				null

			if url? and url != ''
				this.api('drive/files/upload_from_url', {
					url: url
					folder_id: if this.folder? then this.folder.id else undefined

				@dialog do
					'<i class="fa fa-check"></i>アップロードをリクエストしました'
					'アップロードが完了するまで時間がかかる場合があります。'
					[
						text: 'OK' 
					]

		this.createFolder = () => {
			name <~ @input-dialog do
				'フォルダー作成'
				'フォルダー名'
				null

			this.api('drive/folders/create', {
				name: name
				folder_id: if this.folder? then this.folder.id else undefined
			}).then((folder) => {
				@add-folder folder, true
				this.update();
			.catch (err) =>
				console.error err

		this.change-file-input = () => {
			files = this.refs.file-input.files
			for i from 0 to files.length - 1
				file = files.item i
				@upload file, this.folder

		this.upload = (file, folder) => {
			if folder? and typeof folder == 'object' 
				folder = folder.id
			this.refs.uploader.upload file, folder

		this.get-selection = () => {
			this.files.filter (file) -> file._selected

		this.newWindow = (folder-id) => {
			browser = document.body.appendChild(document.createElement('mk-drive-browser-window'));
 			riot.mount browser, do
				folder: folder-id

		this.move = (target-folder) => {
			if target-folder? and typeof target-folder == 'object' 
				target-folder = target-folder.id

			if target-folder == null
				@go-root!
				return

			this.loading = true
			this.update();

			this.api('drive/folders/show', {
				folder_id: target-folder
			}).then((folder) => {
				this.folder = folder
				this.hierarchyFolders = []

				x = (f) =>
					@hierarchyFolders.unshift f
					if f.parent?
						x f.parent

				if folder.parent?
					x folder.parent

				this.update();
				@load!
			.catch (err, text-status) ->
				console.error err

		this.add-folder = (folder, unshift = false) => {
			current = if this.folder? then this.folder.id else null
			if current != folder.parent_id
				return

			if (this.folders.some (f) => f.id == folder.id)
				exist = (this.folders.map (f) -> f.id).index-of folder.id
				this.folders[exist] = folder
				this.update();
				return

			if unshift
				this.folders.unshift folder
			else
				this.folders.push folder

			this.update();

		this.add-file = (file, unshift = false) => {
			current = if this.folder? then this.folder.id else null
			if current != file.folder_id
				return

			if (this.files.some (f) => f.id == file.id)
				exist = (this.files.map (f) -> f.id).index-of file.id
				this.files[exist] = file
				this.update();
				return

			if unshift
				this.files.unshift file
			else
				this.files.push file

			this.update();

		this.remove-folder = (folder) => {
			if typeof folder == 'object' 
				folder = folder.id
			this.folders = this.folders.filter (f) -> f.id != folder
			this.update();

		this.remove-file = (file) => {
			if typeof file == 'object' 
				file = file.id
			this.files = this.files.filter (f) -> f.id != file
			this.update();

		this.go-root = () => {
			if this.folder != null
				this.folder = null
				this.hierarchyFolders = []
				this.update();
				@load!

		this.load = () => {
			this.folders = []
			this.files = []
			this.more-folders = false
			this.more-files = false
			this.loading = true
			this.update();

			load-folders = null
			load-files = null

			folders-max = 30
			files-max = 30

			// フォルダ一覧取得
			this.api('drive/folders', {
				folder_id: if this.folder? then this.folder.id else null
				limit: folders-max + 1
			}).then((folders) => {
				if folders.length == folders-max + 1
					this.more-folders = true
					folders.pop!
				load-folders := folders
				complete!
			.catch (err, text-status) =>
				console.error err

			// ファイル一覧取得
			this.api('drive/files', {
				folder_id: if this.folder? then this.folder.id else null
				limit: files-max + 1
			}).then((files) => {
				if files.length == files-max + 1
					this.more-files = true
					files.pop!
				load-files := files
				complete!
			.catch (err, text-status) =>
				console.error err

			flag = false
			complete = =>
				if flag
					load-folders.forEach (folder) =>
						@add-folder folder
					load-files.forEach (file) =>
						@add-file file
					this.loading = false
					this.update();
				else
					flag := true

		function contains(parent, child)
			node = child.parentNode
			while node?
				if node == parent
					return true
				node = node.parentNode
			return false
	</script>
</mk-drive-browser>
