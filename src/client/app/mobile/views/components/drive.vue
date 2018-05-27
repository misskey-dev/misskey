<template>
<div class="mk-drive">
	<nav ref="nav">
		<a @click.prevent="goRoot()" href="/i/drive">%fa:cloud%%i18n:@drive%</a>
		<template v-for="folder in hierarchyFolders">
			<span :key="folder.id + '>'">%fa:angle-right%</span>
			<a :key="folder.id" @click.prevent="cd(folder)" :href="`/i/drive/folder/${folder.id}`">{{ folder.name }}</a>
		</template>
		<template v-if="folder != null">
			<span>%fa:angle-right%</span>
			<p>{{ folder.name }}</p>
		</template>
		<template v-if="file != null">
			<span>%fa:angle-right%</span>
			<p>{{ file.name }}</p>
		</template>
	</nav>
	<mk-uploader ref="uploader"/>
	<div class="browser" :class="{ fetching }" v-if="file == null">
		<div class="info" v-if="info">
			<p v-if="folder == null">{{ (info.usage / info.capacity * 100).toFixed(1) }}% %i18n:@used%</p>
			<p v-if="folder != null && (folder.foldersCount > 0 || folder.filesCount > 0)">
				<template v-if="folder.foldersCount > 0">{{ folder.foldersCount }} %i18n:@folder-count%</template>
				<template v-if="folder.foldersCount > 0 && folder.filesCount > 0">%i18n:@count-separator%</template>
				<template v-if="folder.filesCount > 0">{{ folder.filesCount }} %i18n:@file-count%</template>
			</p>
		</div>
		<div class="folders" v-if="folders.length > 0">
			<x-folder v-for="folder in folders" :key="folder.id" :folder="folder"/>
			<p v-if="moreFolders">%i18n:@load-more%</p>
		</div>
		<div class="files" v-if="files.length > 0">
			<x-file v-for="file in files" :key="file.id" :file="file"/>
			<button class="more" v-if="moreFiles" @click="fetchMoreFiles">
				{{ fetchingMoreFiles ? '%i18n:common.loading%' : '%i18n:@load-more%' }}
			</button>
		</div>
		<div class="empty" v-if="files.length == 0 && folders.length == 0 && !fetching">
			<p v-if="folder == null">%i18n:@nothing-in-drive%</p>
			<p v-if="folder != null">%i18n:@folder-is-empty%</p>
		</div>
	</div>
	<div class="fetching" v-if="fetching && file == null && files.length == 0 && folders.length == 0">
		<div class="spinner">
			<div class="dot1"></div>
			<div class="dot2"></div>
		</div>
	</div>
	<input ref="file" class="file" type="file" multiple="multiple" @change="onChangeLocalFile"/>
	<x-file-detail v-if="file != null" :file="file"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XFolder from './drive.folder.vue';
import XFile from './drive.file.vue';
import XFileDetail from './drive.file-detail.vue';

export default Vue.extend({
	components: {
		XFolder,
		XFile,
		XFileDetail
	},
	props: ['initFolder', 'initFile', 'selectFile', 'multiple', 'isNaked', 'top'],
	data() {
		return {
			/**
			 * 現在の階層(フォルダ)
			 * * null でルートを表す
			 */
			folder: null,

			file: null,

			files: [],
			folders: [],
			moreFiles: false,
			moreFolders: false,
			hierarchyFolders: [],
			selectedFiles: [],
			info: null,
			connection: null,
			connectionId: null,

			fetching: true,
			fetchingMoreFiles: false,
			fetchingMoreFolders: false
		};
	},
	computed: {
		isFileSelectMode(): boolean {
			return this.selectFile;
		}
	},
	mounted() {
		this.connection = (this as any).os.streams.driveStream.getConnection();
		this.connectionId = (this as any).os.streams.driveStream.use();

		this.connection.on('file_created', this.onStreamDriveFileCreated);
		this.connection.on('file_updated', this.onStreamDriveFileUpdated);
		this.connection.on('folder_created', this.onStreamDriveFolderCreated);
		this.connection.on('folder_updated', this.onStreamDriveFolderUpdated);

		if (this.initFolder) {
			this.cd(this.initFolder, true);
		} else if (this.initFile) {
			this.cf(this.initFile, true);
		} else {
			this.fetch();
		}

		if (this.isNaked) {
			(this.$refs.nav as any).style.top = `${this.top}px`;
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

		dive(folder) {
			this.hierarchyFolders.unshift(folder);
			if (folder.parent) this.dive(folder.parent);
		},

		cd(target, silent = false) {
			this.file = null;

			if (target == null) {
				this.goRoot(silent);
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

				if (folder.parent) this.dive(folder.parent);

				this.$emit('open-folder', this.folder, silent);
				this.fetch();
			});
		},

		addFolder(folder, unshift = false) {
			const current = this.folder ? this.folder.id : null;
			// 追加しようとしているフォルダが、今居る階層とは違う階層のものだったら中断
			if (current != folder.parentId) return;

			// 追加しようとしているフォルダを既に所有してたら中断
			if (this.folders.some(f => f.id == folder.id)) return;

			if (unshift) {
				this.folders.unshift(folder);
			} else {
				this.folders.push(folder);
			}
		},

		addFile(file, unshift = false) {
			const current = this.folder ? this.folder.id : null;
			// 追加しようとしているファイルが、今居る階層とは違う階層のものだったら中断
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

		goRoot(silent = false) {
			if (this.folder || this.file) {
				this.file = null;
				this.folder = null;
				this.hierarchyFolders = [];
				this.$emit('move-root', silent);
				this.fetch();
			}
		},

		fetch() {
			this.folders = [];
			this.files = [];
			this.moreFolders = false;
			this.moreFiles = false;
			this.fetching = true;

			this.$emit('begin-fetch');

			let fetchedFolders = null;
			let fetchedFiles = null;

			const foldersMax = 20;
			const filesMax = 20;

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

					// 一連の読み込みが完了したイベントを発行
					this.$emit('fetched');
				} else {
					flag = true;
					// 一連の読み込みが半分完了したイベントを発行
					this.$emit('fetch-mid');
				}
			};

			if (this.folder == null) {
				// Fetch addtional drive info
				(this as any).api('drive').then(info => {
					this.info = info;
				});
			}
		},

		fetchMoreFiles() {
			this.fetching = true;
			this.fetchingMoreFiles = true;

			const max = 30;

			// ファイル一覧取得
			(this as any).api('drive/files', {
				folderId: this.folder ? this.folder.id : null,
				limit: max + 1,
				untilId: this.files[this.files.length - 1].id
			}).then(files => {
				if (files.length == max + 1) {
					this.moreFiles = true;
					files.pop();
				} else {
					this.moreFiles = false;
				}
				files.forEach(this.appendFile);
				this.fetching = false;
				this.fetchingMoreFiles = false;
			});
		},

		chooseFile(file) {
			if (this.isFileSelectMode) {
				if (this.multiple) {
					if (this.selectedFiles.some(f => f.id == file.id)) {
						this.selectedFiles = this.selectedFiles.filter(f => f.id != file.id);
					} else {
						this.selectedFiles.push(file);
					}
					this.$emit('change-selection', this.selectedFiles);
				} else {
					this.$emit('selected', file);
				}
			} else {
				this.cf(file);
			}
		},

		cf(file, silent = false) {
			if (typeof file == 'object') file = file.id;

			this.fetching = true;

			(this as any).api('drive/files/show', {
				fileId: file
			}).then(file => {
				this.file = file;
				this.folder = null;
				this.hierarchyFolders = [];

				if (file.folder) this.dive(file.folder);

				this.fetching = false;

				this.$emit('open-file', this.file, silent);
			});
		},

		openContextMenu() {
			const fn = window.prompt('%i18n:@prompt%');
			if (fn == null || fn == '') return;
			switch (fn) {
				case '1':
					this.selectLocalFile();
					break;
				case '2':
					this.urlUpload();
					break;
				case '3':
					this.createFolder();
					break;
				case '4':
					this.renameFolder();
					break;
				case '5':
					this.moveFolder();
					break;
				case '6':
					alert('%i18n:@deletion-alert%');
					break;
			}
		},

		selectLocalFile() {
			(this.$refs.file as any).click();
		},

		createFolder() {
			const name = window.prompt('%i18n:@folder-name%');
			if (name == null || name == '') return;
			(this as any).api('drive/folders/create', {
				name: name,
				parentId: this.folder ? this.folder.id : undefined
			}).then(folder => {
				this.addFolder(folder, true);
			});
		},

		renameFolder() {
			if (this.folder == null) {
				alert('%i18n:@root-rename-alert%');
				return;
			}
			const name = window.prompt('%i18n:@folder-name%', this.folder.name);
			if (name == null || name == '') return;
			(this as any).api('drive/folders/update', {
				name: name,
				folderId: this.folder.id
			}).then(folder => {
				this.cd(folder);
			});
		},

		moveFolder() {
			if (this.folder == null) {
				alert('%i18n:@root-move-alert%');
				return;
			}
			(this as any).apis.chooseDriveFolder().then(folder => {
				(this as any).api('drive/folders/update', {
					parentId: folder ? folder.id : null,
					folderId: this.folder.id
				}).then(folder => {
					this.cd(folder);
				});
			});
		},

		urlUpload() {
			const url = window.prompt('%i18n:@url-prompt%');
			if (url == null || url == '') return;
			(this as any).api('drive/files/upload_from_url', {
				url: url,
				folderId: this.folder ? this.folder.id : undefined
			});
			alert('%i18n:@uploading%');
		},

		onChangeLocalFile() {
			Array.from((this.$refs.file as any).files)
				.forEach(f => (this.$refs.uploader as any).upload(f, this.folder));
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-drive
	background #fff

	> nav
		display block
		position sticky
		position -webkit-sticky
		top 0
		z-index 1
		width 100%
		padding 10px 12px
		overflow auto
		white-space nowrap
		font-size 0.9em
		color rgba(#000, 0.67)
		-webkit-backdrop-filter blur(12px)
		backdrop-filter blur(12px)
		background-color rgba(#fff, 0.75)
		border-bottom solid 1px rgba(#000, 0.13)

		> p
		> a
			display inline
			margin 0
			padding 0
			text-decoration none !important
			color inherit

			&:last-child
				font-weight bold

			> [data-fa]
				margin-right 4px

		> span
			margin 0 8px
			opacity 0.5

	> .browser
		&.fetching
			opacity 0.5

		> .info
			border-bottom solid 1px #eee

			&:empty
				display none

			> p
				display block
				max-width 500px
				margin 0 auto
				padding 4px 16px
				font-size 10px
				color #777

		> .folders
			> .folder
				border-bottom solid 1px #eee

		> .files
			> .file
				border-bottom solid 1px #eee

			> .more
				display block
				width 100%
				padding 16px
				font-size 16px
				color #555

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
			background rgba(#000, 0.2)
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

	> .file
		display none

</style>
