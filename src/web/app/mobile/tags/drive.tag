<mk-drive>
	<nav>
		<p onclick={ goRoot }><i class="fa fa-cloud"></i>ドライブ</p>
		<virtual each={ folder in hierarchyFolders }>
			<span><i class="fa fa-angle-right"></i></span>
			<p onclick={ move }>{ folder.name }</p>
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
	<div class="browser { loading: fetching }" if={ file == null }>
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
		<div class="empty" if={ files.length == 0 && folders.length == 0 && !fetching }>
			<p if={ !folder == null }>ドライブには何もありません。</p>
			<p if={ folder != null }>このフォルダーは空です</p>
		</div>
		<div class="loading" if={ fetching }>
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

		this.files = [];
		this.folders = [];
		this.hierarchyFolders = [];
		this.selectedFiles = [];

		// 現在の階層(フォルダ)
		// * null でルートを表す
		this.folder = null;

		this.file = null;

		this.isSelectMode = this.opts.select;
		this.multiple =this.opts.multiple;

		this.on('mount', () => {
			this.stream.on('drive_file_created', this.onStreamDriveFileCreated);
			this.stream.on('drive_file_updated', this.onStreamDriveFileUpdated);
			this.stream.on('drive_folder_created', this.onStreamDriveFolderCreated);
			this.stream.on('drive_folder_updated', this.onStreamDriveFolderUpdated);

			// Riotのバグでnullを渡しても""になる
			// https://github.com/riot/riot/issues/2080
			//if (this.opts.folder)
			//if (this.opts.file)
			if (this.opts.folder && this.opts.folder != '') {
				this.cd(this.opts.folder, true);
			} else if (this.opts.file && this.opts.file != '') {
				this.cf(this.opts.file, true);
			} else {
				this.load();
			}
		});

		this.on('unmount', () => {
			this.stream.off('drive_file_created', this.onStreamDriveFileCreated);
			this.stream.off('drive_file_updated', this.onStreamDriveFileUpdated);
			this.stream.off('drive_folder_created', this.onStreamDriveFolderCreated);
			this.stream.off('drive_folder_updated', this.onStreamDriveFolderUpdated);
		});

		this.onStreamDriveFileCreated = file => {
			this.addFile(file, true);
		};

		this.onStreamDriveFileUpdated = file => {
			const current = this.folder ? this.folder.id : null;
			if (current != file.folder_id) {
				this.removeFile(file);
			} else {
				this.addFile(file, true);
			}
		};

		this.onStreamDriveFolderCreated = folder => {
			this.addFolder(folder, true);
		};

		this.onStreamDriveFolderUpdated = folder => {
			const current = this.folder ? this.folder.id : null;
			if (current != folder.parent_id) {
				this.removeFolder(folder);
			} else {
				this.addFolder(folder, true);
			}
		};

		this.move = ev => {
			this.cd(ev.item.folder);
		};

		this.cd = (target, silent = false) => {
			this.file = null;

			if (target == null) {
				this.goRoot();
				return;
			} else if (typeof target == 'object') target = target.id;

			this.update({
				fetching: true
			});

			this.api('drive/folders/show', {
				folder_id: target
			}).then(folder => {
				this.folder = folder;
				this.hierarchyFolders = [];

				if (folder.parent) dive(folder.parent);

				this.update();
				this.trigger('open-folder', this.folder, silent);
				this.load();
			});
		};

		this.addFolder = (folder, unshift = false) => {
			const current = this.folder ? this.folder.id : null;
			// 追加しようとしているフォルダが、今居る階層とは違う階層のものだったら中断
			if (current != folder.parent_id) return;

			// 追加しようとしているフォルダを既に所有してたら中断
			if (this.folders.some(f => f.id == folder.id)) return;

			if (unshift) {
				this.folders.unshift(folder);
			} else {
				this.folders.push(folder);
			}

			this.update();
		};

		this.addFile = (file, unshift = false) => {
			const current = this.folder ? this.folder.id : null;
			// 追加しようとしているファイルが、今居る階層とは違う階層のものだったら中断
			if (current != file.folder_id) return;

			if (this.files.some(f => f.id == file.id)) {
				const exist = this.files.map(f => f.id).indexOf(file.id);
				this.files[exist] = file;
				this.update();
				return;
			}

			if (unshift) {
				this.files.unshift(file);
			} else {
				this.files.push(file);
			}

			this.update();
		};

		this.removeFolder = folder => {
			if (typeof folder == 'object') folder = folder.id;
			this.folders = this.folders.filter(f => f.id != folder);
			this.update();
		};

		this.removeFile = file => {
			if (typeof file == 'object') file = file.id;
			this.files = this.files.filter(f => f.id != file);
			this.update();
		};

		this.goRoot = () => {
			if (this.folder || this.file) {
				this.update({
					file: null,
					folder: null,
					hierarchyFolders: []
				});
				this.trigger('move-root');
				this.load();
			}
		};

		this.load = () => {
			this.update({
				folders: [],
				files: [],
				moreFolders: false,
				moreFiles: false,
				fetching: true
			});

			this.trigger('begin-load');

			let fetchedFolders = null;
			let fetchedFiles = null;

			const foldersMax = 20;
			const filesMax = 20;

			// フォルダ一覧取得
			this.api('drive/folders', {
				folder_id: this.folder ? this.folder.id : null,
				limit: foldersMax + 1
			}).then(folders => {
				if (folders.length == foldersMax + 1) {
					this.moreFolders = true;
					folders.pop();
				}
				fetchedFolders = folders;
				complete();
			});

			// ファイル一覧取得
			this.api('drive/files', {
				folder_id: this.folder ? this.folder.id : null,
				limit: filesMax + 1
			}).then(files => {
				if (files.length == filesMax + 1) {
					this.moreFiles = true;
					files.pop();
				}
				fetchedFiles = files;
				complete();
			});

			let flag = false;
			const complete = () => {
				if (flag) {
					fetchedFolders.forEach(this.addFolder);
					fetchedFiles.forEach(this.addFile);
					this.update({
						fetching: false
					});
					// 一連の読み込みが完了したイベントを発行
					this.trigger('loaded');
				} else {
					flag = true;
					// 一連の読み込みが半分完了したイベントを発行
					this.trigger('load-mid');
				}
			};
		};

		this.chooseFile = file => {
			if (this.isSelectMode) {
				if (this.selectedFiles.some(f => f.id == file.id)) {
					this.selectedFiles = this.selectedFiles.filter(f => f.id != file.id);
				} else {
					this.selectedFiles.push(file);
				}
				this.update();
				this.trigger('change-selected', this.selectedFiles);
			} else {
				this.cf(file);
			}
		};

		this.cf = (file, silent = false) => {
			if (typeof file == 'object') file = file.id;

			this.update({
				fetching: true
			});

			this.api('drive/files/show', {
				file_id: file
			}).then(file => {
				this.file = file;
				this.folder = null;
				this.hierarchyFolders = [];

				if (file.folder) dive(file.folder);

				this.update();
				this.trigger('open-file', this.file, silent);
			});
		};

		const dive = folder => {
			this.hierarchyFolders.unshift(folder);
			if (folder.parent) dive(folder.parent);
		};
	</script>
</mk-drive>
