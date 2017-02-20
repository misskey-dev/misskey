<mk-drive>
	<nav>
		<p onclick={ goRoot }><i class="fa fa-cloud"></i>ドライブ</p>
		<virtual each={ folder in hierarchyFolders }>
			<span><i class="fa fa-angle-right"></i></span>
			<p onclick={ _move }>{ folder.name }</p>
		</virtual>
		<virtual if={ folder != null }>
			<span><i class="fa fa-angle-right"></i></span>
			<p>{ folder.name }</p>
		</virtual>
		<virtual if={ file != null }>
			<span><i class="fa fa-angle-right"></i></span>
			<p>{ file.name }</p>
		</virtual>
	</nav>
	<div class="browser { loading: loading }" if={ file == null }>
		<div class="folders" if={ folders.length > 0 }>
			<virtual each={ folder in folders }>
				<mk-drive-folder folder={ folder }></mk-drive-folder>
			</virtual>
			<p if={ moreFolders }>もっと読み込む</p>
		</div>
		<div class="files" if={ files.length > 0 }>
			<virtual each={ file in files }>
				<mk-drive-file file={ file }></mk-drive-file>
			</virtual>
			<p if={ moreFiles }>もっと読み込む</p>
		</div>
		<div class="empty" if={ files.length == 0 && folders.length == 0 && !loading }>
			<p if={ !folder == null }>ドライブには何もありません。</p>
			<p if={ folder != null }>このフォルダーは空です</p>
		</div>
		<div class="loading" if={ loading }>
			<div class="spinner">
				<div class="dot1"></div>
				<div class="dot2"></div>
			</div>
		</div>
	</div>
	<mk-drive-file-viewer if={ file != null } file={ file }></mk-drive-file-viewer>
	<style>
		:scope
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

	</style>
	<script>
		this.mixin('api');
		this.mixin('stream');

		this.files = []
		this.folders = []
		this.hierarchy-folders = []
		this.selected-files = []

		// 現在の階層(フォルダ)
		// * null でルートを表す
		this.folder = null

		this.file = null

		this.is-select-mode = this.opts.select? and this.opts.select
		this.multiple = if this.opts.multiple? then this.opts.multiple else false

		this.on('mount', () => {
			@stream.on 'drive_file_created' this.on-stream-drive-file-created
			@stream.on 'drive_file_updated' this.on-stream-drive-file-updated
			@stream.on 'drive_folder_created' this.on-stream-drive-folder-created
			@stream.on 'drive_folder_updated' this.on-stream-drive-folder-updated

			// Riotのバグでnullを渡しても""になる
			// https://github.com/riot/riot/issues/2080
			#if this.opts.folder?
			if this.opts.folder? and this.opts.folder != ''
				@cd this.opts.folder, true
			else if this.opts.file? and this.opts.file != ''
				@cf this.opts.file, true
			else
				@load!

		this.on('unmount', () => {
			@stream.off 'drive_file_created' this.on-stream-drive-file-created
			@stream.off 'drive_file_updated' this.on-stream-drive-file-updated
			@stream.off 'drive_folder_created' this.on-stream-drive-folder-created
			@stream.off 'drive_folder_updated' this.on-stream-drive-folder-updated

		on-stream-drive-file-created(file) {
			@add-file file, true

		on-stream-drive-file-updated(file) {
			current = if @folder? then @folder.id else null
			if current != file.folder_id
				@remove-file file
			else
				@add-file file, true

		on-stream-drive-folder-created(folder) {
			@add-folder folder, true

		on-stream-drive-folder-updated(folder) {
			current = if @folder? then @folder.id else null
			if current != folder.parent_id
				@remove-folder folder
			else
				@add-folder folder, true

		@_move = (ev) =>
			@move ev.item.folder

		move(target-folder) {
			@cd target-folder

		cd(target-folder, silent = false) {
			this.file = null

			if target-folder? and typeof target-folder == 'object' 
				target-folder = target-folder.id

			if target-folder == null
				@go-root!
				return

			this.loading = true
			this.update();

			this.api 'drive/folders/show' do
				folder_id: target-folder
			.then (folder) =>
				this.folder = folder
				this.hierarchy-folders = []

				x = (f) =>
					@hierarchy-folders.unshift f
					if f.parent?
						x f.parent

				if folder.parent?
					x folder.parent

				this.update();
				this.trigger 'open-folder' @folder, silent
				@load!
			.catch (err, text-status) ->
				console.error err

		add-folder(folder, unshift = false) {
			current = if @folder? then @folder.id else null
			if current != folder.parent_id
				return

			if (@folders.some (f) => f.id == folder.id)
				return

			if unshift
				@folders.unshift folder
			else
				@folders.push folder

			this.update();

		add-file(file, unshift = false) {
			current = if @folder? then @folder.id else null
			if current != file.folder_id
				return

			if (@files.some (f) => f.id == file.id)
				exist = (@files.map (f) -> f.id).index-of file.id
				@files[exist] = file
				this.update();
				return

			if unshift
				@files.unshift file
			else
				@files.push file

			this.update();

		remove-folder(folder) {
			if typeof folder == 'object' 
				folder = folder.id
			this.folders = @folders.filter (f) -> f.id != folder
			this.update();

		remove-file(file) {
			if typeof file == 'object' 
				file = file.id
			this.files = @files.filter (f) -> f.id != file
			this.update();

		go-root() {
			if @folder != null or @file != null
				this.file = null
				this.folder = null
				this.hierarchy-folders = []
				this.update();
				this.trigger('move-root');
				@load!

		load() {
			this.folders = []
			this.files = []
			this.more-folders = false
			this.more-files = false
			this.loading = true
			this.update();

			this.trigger('begin-load');

			load-folders = null
			load-files = null

			folders-max = 20
			files-max = 20

			// フォルダ一覧取得
			this.api 'drive/folders' do
				folder_id: if @folder? then @folder.id else null
				limit: folders-max + 1
			.then (folders) =>
				if folders.length == folders-max + 1
					this.more-folders = true
					folders.pop!
				load-folders := folders
				complete!
			.catch (err, text-status) =>
				console.error err

			// ファイル一覧取得
			this.api 'drive/files' do
				folder_id: if @folder? then @folder.id else null
				limit: files-max + 1
			.then (files) =>
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
					load-folders.for-each (folder) =>
						@add-folder folder
					load-files.for-each (file) =>
						@add-file file
					this.loading = false
					this.update();

					this.trigger('loaded');
				else
					flag := true
					this.trigger('load-mid');

		choose-file(file) {
			if @is-select-mode
				exist = @selected-files.some (f) => f.id == file.id
				if exist
					selected-files(@selected-files.filter (f) { f.id != file.id)
				else
					@selected-files.push file
				this.update();
				this.trigger 'change-selected' @selected-files
			else
				@cf file

		cf(file, silent = false) {
			if typeof file == 'object' 
				file = file.id

			this.loading = true
			this.update();

			this.api 'drive/files/show' do
				file_id: file
			.then (file) =>
				this.file = file
				this.folder = null
				this.hierarchy-folders = []

				x = (f) =>
					@hierarchy-folders.unshift f
					if f.parent?
						x f.parent

				if file.folder?
					x file.folder

				this.update();
				this.trigger 'open-file' @file, silent
	</script>
</mk-drive>
