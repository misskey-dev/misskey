<template>
<div class="mk-drive">
	<nav>
		<div class="path" @contextmenu.prevent.stop="() => {}">
			<x-nav-folder :class="{ current: folder == null }"/>
			<template v-for="folder in hierarchyFolders">
				<span class="separator">%fa:angle-right%</span>
				<x-nav-folder :folder="folder" :key="folder.id"/>
			</template>
			<span class="separator" v-if="folder != null">%fa:angle-right%</span>
			<span class="folder current" v-if="folder != null">{{ folder.name }}</span>
		</div>
		<input class="search" type="search" placeholder="&#xf002; %i18n:@search%"/>
	</nav>
	<div class="main" :class="{ uploading: uploadings.length > 0, fetching }"
		ref="main"
		@mousedown="onMousedown"
		@dragover.prevent.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.prevent.stop="onDrop"
		@contextmenu.prevent.stop="onContextmenu"
	>
		<div class="selection" ref="selection"></div>
		<div class="contents" ref="contents">
			<div class="folders" ref="foldersContainer" v-if="folders.length > 0">
				<x-folder v-for="folder in folders" :key="folder.id" class="folder" :folder="folder"/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" v-for="n in 16"></div>
				<button v-if="moreFolders">%i18n:@load-more%</button>
			</div>
			<div class="files" ref="filesContainer" v-if="files.length > 0">
				<x-file v-for="file in files" :key="file.id" class="file" :file="file"/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" v-for="n in 16"></div>
				<button v-if="moreFiles" @click="fetchMoreFiles">%i18n:@load-more%</button>
			</div>
			<div class="empty" v-if="files.length == 0 && folders.length == 0 && !fetching">
				<p v-if="draghover">%i18n:@empty-draghover%</p>
				<p v-if="!draghover && folder == null"><strong>%i18n:@empty-drive%</strong><br/>%i18n:@empty-drive-description%</p>
				<p v-if="!draghover && folder != null">%i18n:@empty-folder%</p>
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
	<mk-uploader ref="uploader" @change="onChangeUploaderUploads" @uploaded="onUploaderUploaded"/>
	<input ref="fileInput" type="file" accept="*/*" multiple="multiple" tabindex="-1" @change="onChangeFileInput"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkDriveWindow from './drive-window.vue';
import XNavFolder from './drive.nav-folder.vue';
import XFolder from './drive.folder.vue';
import XFile from './drive.file.vue';
import contains from '../../../common/scripts/contains';
import contextmenu from '../../api/contextmenu';
import { url } from '../../../config';

export default Vue.extend({
	components: {
		XNavFolder,
		XFolder,
		XFile
	},
	props: {
		initFolder: {
			type: Object,
			required: false
		},
		multiple: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			/**
			 * 現在の階層(フォルダ)
			 * * null でルートを表す
			 */
			folder: null,

			files: [],
			folders: [],
			moreFiles: false,
			moreFolders: false,
			hierarchyFolders: [],
			selectedFiles: [],
			uploadings: [],
			connection: null,
			connectionId: null,

			/**
			 * ドロップされようとしているか
			 */
			draghover: false,

			/**
			 * 自信の所有するアイテムがドラッグをスタートさせたか
			 * (自分自身の階層にドロップできないようにするためのフラグ)
			 */
			isDragSource: false,

			fetching: true
		};
	},
	mounted() {
		this.connection = (this as any).os.streams.driveStream.getConnection();
		this.connectionId = (this as any).os.streams.driveStream.use();

		this.connection.on('file_created', this.onStreamDriveFileCreated);
		this.connection.on('file_updated', this.onStreamDriveFileUpdated);
		this.connection.on('folder_created', this.onStreamDriveFolderCreated);
		this.connection.on('folder_updated', this.onStreamDriveFolderUpdated);

		if (this.initFolder) {
			this.move(this.initFolder);
		} else {
			this.fetch();
		}
	},
	beforeDestroy() {
		this.connection.off('file_created', this.onStreamDriveFileCreated);
		this.connection.off('file_updated', this.onStreamDriveFileUpdated);
		this.connection.off('folder_created', this.onStreamDriveFolderCreated);
		this.connection.off('folder_updated', this.onStreamDriveFolderUpdated);
		(this as any).os.streams.driveStream.dispose(this.connectionId);
	},
	methods: {
		onContextmenu(e) {
			contextmenu(e, [{
				type: 'item',
				text: '%i18n:@contextmenu.create-folder%',
				icon: '%fa:R folder%',
				onClick: this.createFolder
			}, {
				type: 'item',
				text: '%i18n:@contextmenu.upload%',
				icon: '%fa:upload%',
				onClick: this.selectLocalFile
			}, {
				type: 'item',
				text: '%i18n:@contextmenu.url-upload%',
				icon: '%fa:cloud-upload-alt%',
				onClick: this.urlUpload
			}]);
		},

		onStreamDriveFileCreated(file) {
			this.addFile(file, true);
		},

		onStreamDriveFileUpdated(file) {
			const current = this.folder ? this.folder.id : null;
			if (current != file.folderId) {
				this.removeFile(file);
			} else {
				this.addFile(file, true);
			}
		},

		onStreamDriveFolderCreated(folder) {
			this.addFolder(folder, true);
		},

		onStreamDriveFolderUpdated(folder) {
			const current = this.folder ? this.folder.id : null;
			if (current != folder.parentId) {
				this.removeFolder(folder);
			} else {
				this.addFolder(folder, true);
			}
		},

		onChangeUploaderUploads(uploads) {
			this.uploadings = uploads;
		},

		onUploaderUploaded(file) {
			this.addFile(file, true);
		},

		onMousedown(e): any {
			if (contains(this.$refs.foldersContainer, e.target) || contains(this.$refs.filesContainer, e.target)) return true;

			const main = this.$refs.main as any;
			const selection = this.$refs.selection as any;

			const rect = main.getBoundingClientRect();

			const left = e.pageX + main.scrollLeft - rect.left - window.pageXOffset
			const top = e.pageY + main.scrollTop - rect.top - window.pageYOffset

			const move = e => {
				selection.style.display = 'block';

				const cursorX = e.pageX + main.scrollLeft - rect.left - window.pageXOffset;
				const cursorY = e.pageY + main.scrollTop - rect.top - window.pageYOffset;
				const w = cursorX - left;
				const h = cursorY - top;

				if (w > 0) {
					selection.style.width = w + 'px';
					selection.style.left = left + 'px';
				} else {
					selection.style.width = -w + 'px';
					selection.style.left = cursorX + 'px';
				}

				if (h > 0) {
					selection.style.height = h + 'px';
					selection.style.top = top + 'px';
				} else {
					selection.style.height = -h + 'px';
					selection.style.top = cursorY + 'px';
				}
			};

			const up = e => {
				document.documentElement.removeEventListener('mousemove', move);
				document.documentElement.removeEventListener('mouseup', up);

				selection.style.display = 'none';
			};

			document.documentElement.addEventListener('mousemove', move);
			document.documentElement.addEventListener('mouseup', up);
		},

		onDragover(e): any {
			// ドラッグ元が自分自身の所有するアイテムだったら
			if (this.isDragSource) {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == 'mk_drive_file';
			const isDriveFolder = e.dataTransfer.types[0] == 'mk_drive_folder';

			if (isFile || isDriveFile || isDriveFolder) {
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			} else {
				e.dataTransfer.dropEffect = 'none';
			}

			return false;
		},

		onDragenter(e) {
			if (!this.isDragSource) this.draghover = true;
		},

		onDragleave(e) {
			this.draghover = false;
		},

		onDrop(e): any {
			this.draghover = false;

			// ドロップされてきたものがファイルだったら
			if (e.dataTransfer.files.length > 0) {
				Array.from(e.dataTransfer.files).forEach(file => {
					this.upload(file, this.folder);
				});
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				if (this.files.some(f => f.id == file.id)) return;
				this.removeFile(file.id);
				(this as any).api('drive/files/update', {
					fileId: file.id,
					folderId: this.folder ? this.folder.id : null
				});
			}
			//#endregion

			//#region ドライブのフォルダ
			const driveFolder = e.dataTransfer.getData('mk_drive_folder');
			if (driveFolder != null && driveFolder != '') {
				const folder = JSON.parse(driveFolder);

				// 移動先が自分自身ならreject
				if (this.folder && folder.id == this.folder.id) return false;
				if (this.folders.some(f => f.id == folder.id)) return false;
				this.removeFolder(folder.id);
				(this as any).api('drive/folders/update', {
					folderId: folder.id,
					parentId: this.folder ? this.folder.id : null
				}).then(() => {
					// noop
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							(this as any).apis.dialog({
								title: '%fa:exclamation-triangle%%i18n:@unable-to-process%',
								text: '%i18n:@circular-reference-detected%',
								actions: [{
									text: '%i18n:common.ok%'
								}]
							});
							break;
						default:
							alert('%i18n:@unhandled-error% ' + err);
					}
				});
			}
			//#endregion
		},

		selectLocalFile() {
			(this.$refs.fileInput as any).click();
		},

		urlUpload() {
			(this as any).apis.input({
				title: '%i18n:@url-upload%',
				placeholder: '%i18n:@url-of-file%'
			}).then(url => {
				(this as any).api('drive/files/upload_from_url', {
					url: url,
					folderId: this.folder ? this.folder.id : undefined
				});

				(this as any).apis.dialog({
					title: '%fa:check%%i18n:@url-upload-requested%',
					text: '%i18n:@may-take-time%',
					actions: [{
						text: '%i18n:common.ok%'
					}]
				});
			});
		},

		createFolder() {
			(this as any).apis.input({
				title: '%i18n:@create-folder%',
				placeholder: '%i18n:@folder-name%'
			}).then(name => {
				(this as any).api('drive/folders/create', {
					name: name,
					folderId: this.folder ? this.folder.id : undefined
				}).then(folder => {
					this.addFolder(folder, true);
				});
			});
		},

		onChangeFileInput() {
			Array.from((this.$refs.fileInput as any).files).forEach(file => {
				this.upload(file, this.folder);
			});
		},

		upload(file, folder) {
			if (folder && typeof folder == 'object') folder = folder.id;
			(this.$refs.uploader as any).upload(file, folder);
		},

		chooseFile(file) {
			const isAlreadySelected = this.selectedFiles.some(f => f.id == file.id);
			if (this.multiple) {
				if (isAlreadySelected) {
					this.selectedFiles = this.selectedFiles.filter(f => f.id != file.id);
				} else {
					this.selectedFiles.push(file);
				}
				this.$emit('change-selection', this.selectedFiles);
			} else {
				if (isAlreadySelected) {
					this.$emit('selected', file);
				} else {
					this.selectedFiles = [file];
					this.$emit('change-selection', [file]);
				}
			}
		},

		newWindow(folder) {
			if (document.body.clientWidth > 800) {
				(this as any).os.new(MkDriveWindow, {
					folder: folder
				});
			} else {
				window.open(url + '/i/drive/folder/' + folder.id,
					'drive_window',
					'height=500, width=800');
			}
		},

		move(target) {
			if (target == null) {
				this.goRoot();
				return;
			} else if (typeof target == 'object') {
				target = target.id;
			}

			this.fetching = true;

			(this as any).api('drive/folders/show', {
				folderId: target
			}).then(folder => {
				this.folder = folder;
				this.hierarchyFolders = [];

				const dive = folder => {
					this.hierarchyFolders.unshift(folder);
					if (folder.parent) dive(folder.parent);
				};

				if (folder.parent) dive(folder.parent);

				this.$emit('open-folder', folder);
				this.fetch();
			});
		},

		addFolder(folder, unshift = false) {
			const current = this.folder ? this.folder.id : null;
			if (current != folder.parentId) return;

			if (this.folders.some(f => f.id == folder.id)) {
				const exist = this.folders.map(f => f.id).indexOf(folder.id);
				Vue.set(this.folders, exist, folder);
				return;
			}

			if (unshift) {
				this.folders.unshift(folder);
			} else {
				this.folders.push(folder);
			}
		},

		addFile(file, unshift = false) {
			const current = this.folder ? this.folder.id : null;
			if (current != file.folderId) return;

			if (this.files.some(f => f.id == file.id)) {
				const exist = this.files.map(f => f.id).indexOf(file.id);
				Vue.set(this.files, exist, file);
				return;
			}

			if (unshift) {
				this.files.unshift(file);
			} else {
				this.files.push(file);
			}
		},

		removeFolder(folder) {
			if (typeof folder == 'object') folder = folder.id;
			this.folders = this.folders.filter(f => f.id != folder);
		},

		removeFile(file) {
			if (typeof file == 'object') file = file.id;
			this.files = this.files.filter(f => f.id != file);
		},

		appendFile(file) {
			this.addFile(file);
		},

		appendFolder(folder) {
			this.addFolder(folder);
		},

		prependFile(file) {
			this.addFile(file, true);
		},

		prependFolder(folder) {
			this.addFolder(folder, true);
		},

		goRoot() {
			// 既にrootにいるなら何もしない
			if (this.folder == null) return;

			this.folder = null;
			this.hierarchyFolders = [];
			this.$emit('move-root');
			this.fetch();
		},

		fetch() {
			this.folders = [];
			this.files = [];
			this.moreFolders = false;
			this.moreFiles = false;
			this.fetching = true;

			let fetchedFolders = null;
			let fetchedFiles = null;

			const foldersMax = 30;
			const filesMax = 30;

			// フォルダ一覧取得
			(this as any).api('drive/folders', {
				folderId: this.folder ? this.folder.id : null,
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
			(this as any).api('drive/files', {
				folderId: this.folder ? this.folder.id : null,
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
					this.fetching = false;
				} else {
					flag = true;
				}
			};
		},

		fetchMoreFiles() {
			this.fetching = true;

			const max = 30;

			// ファイル一覧取得
			(this as any).api('drive/files', {
				folderId: this.folder ? this.folder.id : null,
				limit: max + 1
			}).then(files => {
				if (files.length == max + 1) {
					this.moreFiles = true;
					files.pop();
				} else {
					this.moreFiles = false;
				}
				files.forEach(this.appendFile);
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-drive

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

	> .mk-uploader
		height 100px
		padding 16px
		background #fff

	> input
		display none

</style>
