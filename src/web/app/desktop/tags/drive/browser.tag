<mk-drive-browser>
	<nav>
		<div class="path" oncontextmenu={ pathOncontextmenu }>
			<mk-drive-browser-nav-folder class={ current: folder == null } folder={ null }/>
			<virtual each={ folder in hierarchyFolders }>
				<span class="separator">%fa:angle-right%</span>
				<mk-drive-browser-nav-folder folder={ folder }/>
			</virtual>
			<span class="separator" v-if="folder != null">%fa:angle-right%</span>
			<span class="folder current" v-if="folder != null">{ folder.name }</span>
		</div>
		<input class="search" type="search" placeholder="&#xf002; %i18n:desktop.tags.mk-drive-browser.search%"/>
	</nav>
	<div class="main { uploading: uploads.length > 0, fetching: fetching }" ref="main" onmousedown={ onmousedown } ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop } oncontextmenu={ oncontextmenu }>
		<div class="selection" ref="selection"></div>
		<div class="contents" ref="contents">
			<div class="folders" ref="foldersContainer" v-if="folders.length > 0">
				<virtual each={ folder in folders }>
					<mk-drive-browser-folder class="folder" folder={ folder }/>
				</virtual>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" each={ Array(10).fill(16) }></div>
				<button v-if="moreFolders">%i18n:desktop.tags.mk-drive-browser.load-more%</button>
			</div>
			<div class="files" ref="filesContainer" v-if="files.length > 0">
				<virtual each={ file in files }>
					<mk-drive-browser-file class="file" file={ file }/>
				</virtual>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" each={ Array(10).fill(16) }></div>
				<button v-if="moreFiles" @click="fetchMoreFiles">%i18n:desktop.tags.mk-drive-browser.load-more%</button>
			</div>
			<div class="empty" v-if="files.length == 0 && folders.length == 0 && !fetching">
				<p v-if="draghover">%i18n:desktop.tags.mk-drive-browser.empty-draghover%</p>
				<p v-if="!draghover && folder == null"><strong>%i18n:desktop.tags.mk-drive-browser.empty-drive%</strong><br/>%i18n:desktop.tags.mk-drive-browser.empty-drive-description%</p>
				<p v-if="!draghover && folder != null">%i18n:desktop.tags.mk-drive-browser.empty-folder%</p>
			</div>
		</div>
		<div class="fetching" v-if="fetching">
			<div class="spinner">
				<div class="dot1"></div>
				<div class="dot2"></div>
			</div>
		</div>
	</div>
	<div class="dropzone" v-if="draghover"></div>
	<mk-uploader ref="uploader"/>
	<input ref="fileInput" type="file" accept="*/*" multiple="multiple" tabindex="-1" onchange={ changeFileInput }/>
	<style lang="stylus" scoped>
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

							> [data-fa]
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
						color $ui-control-foreground-color

			> .main
				padding 8px
				height calc(100% - 38px)
				overflow auto

				&, *
					user-select none

				&.fetching
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
					> .files
						display flex
						flex-wrap wrap

						> .folder
						> .file
							flex-grow 1
							width 144px
							margin 4px

						> .padding
							flex-grow 1
							pointer-events none
							width 144px + 8px // 8px is margin

					> .empty
						padding 16px
						text-align center
						color #999
						pointer-events none

						> p
							margin 0

				> .fetching
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
		import contains from '../../../common/scripts/contains';
		import dialog from '../../scripts/dialog';
		import inputDialog from '../../scripts/input-dialog';

		this.mixin('i');
		this.mixin('api');

		this.mixin('drive-stream');
		this.connection = this.driveStream.getConnection();
		this.connectionId = this.driveStream.use();

		this.files = [];
		this.folders = [];
		this.hierarchyFolders = [];
		this.selectedFiles = [];

		this.uploads = [];

		// 現在の階層(フォルダ)
		// * null でルートを表す
		this.folder = null;

		this.multiple = this.opts.multiple != null ? this.opts.multiple : false;

		// ドロップされようとしているか
		this.draghover = false;

		// 自信の所有するアイテムがドラッグをスタートさせたか
		// (自分自身の階層にドロップできないようにするためのフラグ)
		this.isDragSource = false;

		this.on('mount', () => {
			this.$refs.uploader.on('uploaded', file => {
				this.addFile(file, true);
			});

			this.$refs.uploader.on('change-uploads', uploads => {
				this.update({
					uploads: uploads
				});
			});

			this.connection.on('file_created', this.onStreamDriveFileCreated);
			this.connection.on('file_updated', this.onStreamDriveFileUpdated);
			this.connection.on('folder_created', this.onStreamDriveFolderCreated);
			this.connection.on('folder_updated', this.onStreamDriveFolderUpdated);

			if (this.opts.folder) {
				this.move(this.opts.folder);
			} else {
				this.fetch();
			}
		});

		this.on('unmount', () => {
			this.connection.off('file_created', this.onStreamDriveFileCreated);
			this.connection.off('file_updated', this.onStreamDriveFileUpdated);
			this.connection.off('folder_created', this.onStreamDriveFolderCreated);
			this.connection.off('folder_updated', this.onStreamDriveFolderUpdated);
			this.driveStream.dispose(this.connectionId);
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

		this.onmousedown = e => {
			if (contains(this.$refs.foldersContainer, e.target) || contains(this.$refs.filesContainer, e.target)) return true;

			const rect = this.$refs.main.getBoundingClientRect();

			const left = e.pageX + this.$refs.main.scrollLeft - rect.left - window.pageXOffset
			const top = e.pageY + this.$refs.main.scrollTop - rect.top - window.pageYOffset

			const move = e => {
				this.$refs.selection.style.display = 'block';

				const cursorX = e.pageX + this.$refs.main.scrollLeft - rect.left - window.pageXOffset;
				const cursorY = e.pageY + this.$refs.main.scrollTop - rect.top - window.pageYOffset;
				const w = cursorX - left;
				const h = cursorY - top;

				if (w > 0) {
					this.$refs.selection.style.width = w + 'px';
					this.$refs.selection.style.left = left + 'px';
				} else {
					this.$refs.selection.style.width = -w + 'px';
					this.$refs.selection.style.left = cursorX + 'px';
				}

				if (h > 0) {
					this.$refs.selection.style.height = h + 'px';
					this.$refs.selection.style.top = top + 'px';
				} else {
					this.$refs.selection.style.height = -h + 'px';
					this.$refs.selection.style.top = cursorY + 'px';
				}
			};

			const up = e => {
				document.documentElement.removeEventListener('mousemove', move);
				document.documentElement.removeEventListener('mouseup', up);

				this.$refs.selection.style.display = 'none';
			};

			document.documentElement.addEventListener('mousemove', move);
			document.documentElement.addEventListener('mouseup', up);
		};

		this.pathOncontextmenu = e => {
			e.preventDefault();
			e.stopImmediatePropagation();
			return false;
		};

		this.ondragover = e => {
			e.preventDefault();
			e.stopPropagation();

			// ドラッグ元が自分自身の所有するアイテムかどうか
			if (!this.isDragSource) {
				// ドラッグされてきたものがファイルだったら
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
				this.draghover = true;
			} else {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return false;
			}
		};

		this.ondragenter = e => {
			e.preventDefault();
			if (!this.isDragSource) this.draghover = true;
		};

		this.ondragleave = e => {
			this.draghover = false;
		};

		this.ondrop = e => {
			e.preventDefault();
			e.stopPropagation();

			this.draghover = false;

			// ドロップされてきたものがファイルだったら
			if (e.dataTransfer.files.length > 0) {
				Array.from(e.dataTransfer.files).forEach(file => {
					this.upload(file, this.folder);
				});
				return false;
			}

			// データ取得
			const data = e.dataTransfer.getData('text');
			if (data == null) return false;

			// パース
			// TODO: JSONじゃなかったら中断
			const obj = JSON.parse(data);

			// (ドライブの)ファイルだったら
			if (obj.type == 'file') {
				const file = obj.id;
				if (this.files.some(f => f.id == file)) return false;
				this.removeFile(file);
				this.api('drive/files/update', {
					file_id: file,
					folder_id: this.folder ? this.folder.id : null
				});
			// (ドライブの)フォルダーだったら
			} else if (obj.type == 'folder') {
				const folder = obj.id;
				// 移動先が自分自身ならreject
				if (this.folder && folder == this.folder.id) return false;
				if (this.folders.some(f => f.id == folder)) return false;
				this.removeFolder(folder);
				this.api('drive/folders/update', {
					folder_id: folder,
					parent_id: this.folder ? this.folder.id : null
				}).then(() => {
					// something
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							dialog('%fa:exclamation-triangle%%i18n:desktop.tags.mk-drive-browser.unable-to-process%',
								'%i18n:desktop.tags.mk-drive-browser.circular-reference-detected%', [{
								text: '%i18n:common.ok%'
							}]);
							break;
						default:
							alert('%i18n:desktop.tags.mk-drive-browser.unhandled-error% ' + err);
					}
				});
			}

			return false;
		};

		this.oncontextmenu = e => {
			e.preventDefault();
			e.stopImmediatePropagation();

			const ctx = riot.mount(document.body.appendChild(document.createElement('mk-drive-browser-base-contextmenu')), {
				browser: this
			})[0];
			ctx.open({
				x: e.pageX - window.pageXOffset,
				y: e.pageY - window.pageYOffset
			});

			return false;
		};

		this.selectLocalFile = () => {
			this.$refs.fileInput.click();
		};

		this.urlUpload = () => {
			inputDialog('%i18n:desktop.tags.mk-drive-browser.url-upload%',
				'%i18n:desktop.tags.mk-drive-browser.url-of-file%', null, url => {

				this.api('drive/files/upload_from_url', {
					url: url,
					folder_id: this.folder ? this.folder.id : undefined
				});

				dialog('%fa:check%%i18n:desktop.tags.mk-drive-browser.url-upload-requested%',
					'%i18n:desktop.tags.mk-drive-browser.may-take-time%', [{
					text: '%i18n:common.ok%'
				}]);
			});
		};

		this.createFolder = () => {
			inputDialog('%i18n:desktop.tags.mk-drive-browser.create-folder%',
				'%i18n:desktop.tags.mk-drive-browser.folder-name%', null, name => {

				this.api('drive/folders/create', {
					name: name,
					folder_id: this.folder ? this.folder.id : undefined
				}).then(folder => {
					this.addFolder(folder, true);
					this.update();
				});
			});
		};

		this.changeFileInput = () => {
			Array.from(this.$refs.fileInput.files).forEach(file => {
				this.upload(file, this.folder);
			});
		};

		this.upload = (file, folder) => {
			if (folder && typeof folder == 'object') folder = folder.id;
			this.$refs.uploader.upload(file, folder);
		};

		this.chooseFile = file => {
			const isAlreadySelected = this.selectedFiles.some(f => f.id == file.id);
			if (this.multiple) {
				if (isAlreadySelected) {
					this.selectedFiles = this.selectedFiles.filter(f => f.id != file.id);
				} else {
					this.selectedFiles.push(file);
				}
				this.update();
				this.trigger('change-selection', this.selectedFiles);
			} else {
				if (isAlreadySelected) {
					this.trigger('selected', file);
				} else {
					this.selectedFiles = [file];
					this.trigger('change-selection', [file]);
				}
			}
		};

		this.newWindow = folderId => {
			riot.mount(document.body.appendChild(document.createElement('mk-drive-browser-window')), {
				folder: folderId
			});
		};

		this.move = target => {
			if (target == null) {
				this.goRoot();
				return;
			} else if (typeof target == 'object') {
				target = target.id;
			}

			this.update({
				fetching: true
			});

			this.api('drive/folders/show', {
				folder_id: target
			}).then(folder => {
				this.folder = folder;
				this.hierarchyFolders = [];

				const dive = folder => {
					this.hierarchyFolders.unshift(folder);
					if (folder.parent) dive(folder.parent);
				};

				if (folder.parent) dive(folder.parent);

				this.update();
				this.trigger('open-folder', folder);
				this.fetch();
			});
		};

		this.addFolder = (folder, unshift = false) => {
			const current = this.folder ? this.folder.id : null;
			if (current != folder.parent_id) return;

			if (this.folders.some(f => f.id == folder.id)) {
				const exist = this.folders.map(f => f.id).indexOf(folder.id);
				this.folders[exist] = folder;
				this.update();
				return;
			}

			if (unshift) {
				this.folders.unshift(folder);
			} else {
				this.folders.push(folder);
			}

			this.update();
		};

		this.addFile = (file, unshift = false) => {
			const current = this.folder ? this.folder.id : null;
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

		this.appendFile = file => this.addFile(file);
		this.appendFolder = file => this.addFolder(file);
		this.prependFile = file => this.addFile(file, true);
		this.prependFolder = file => this.addFolder(file, true);

		this.goRoot = () => {
			// 既にrootにいるなら何もしない
			if (this.folder == null) return;

			this.update({
				folder: null,
				hierarchyFolders: []
			});
			this.trigger('move-root');
			this.fetch();
		};

		this.fetch = () => {
			this.update({
				folders: [],
				files: [],
				moreFolders: false,
				moreFiles: false,
				fetching: true
			});

			let fetchedFolders = null;
			let fetchedFiles = null;

			const foldersMax = 30;
			const filesMax = 30;

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
					fetchedFolders.forEach(this.appendFolder);
					fetchedFiles.forEach(this.appendFile);
					this.update({
						fetching: false
					});
				} else {
					flag = true;
				}
			};
		};

		this.fetchMoreFiles = () => {
			this.update({
				fetching: true
			});

			const max = 30;

			// ファイル一覧取得
			this.api('drive/files', {
				folder_id: this.folder ? this.folder.id : null,
				limit: max + 1
			}).then(files => {
				if (files.length == max + 1) {
					this.moreFiles = true;
					files.pop();
				} else {
					this.moreFiles = false;
				}
				files.forEach(this.appendFile);
				this.update({
					fetching: false
				});
			});
		};

	</script>
</mk-drive-browser>
