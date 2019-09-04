<template>
<div class="kmmwchoexgckptowjmjgfsygeltxfeqs">
	<nav ref="nav">
		<a @click.prevent="goRoot()" href="/i/drive"><fa icon="cloud"/>{{ $t('@.drive') }}</a>
		<template v-for="folder in hierarchyFolders">
			<span :key="folder.id + '>'"><fa icon="angle-right"/></span>
			<a :key="folder.id" @click.prevent="cd(folder)" :href="`/i/drive/folder/${folder.id}`">{{ folder.name }}</a>
		</template>
		<template v-if="folder != null">
			<span><fa icon="angle-right"/></span>
			<p>{{ folder.name }}</p>
		</template>
		<template v-if="file != null">
			<span><fa icon="angle-right"/></span>
			<p>{{ file.name }}</p>
		</template>
	</nav>
	<mk-uploader ref="uploader"/>
	<div class="browser" :class="{ fetching }" v-if="file == null">
		<div class="info" v-if="info">
			<p v-if="folder == null">{{ (info.usage / info.capacity * 100).toFixed(1) }}% {{ $t('used') }}</p>
			<p v-if="folder != null && (folder.foldersCount > 0 || folder.filesCount > 0)">
				<template v-if="folder.foldersCount > 0">{{ folder.foldersCount }} {{ $t('folder-count') }}</template>
				<template v-if="folder.foldersCount > 0 && folder.filesCount > 0">{{ $t('count-separator') }}</template>
				<template v-if="folder.filesCount > 0">{{ folder.filesCount }} {{ $t('file-count') }}</template>
			</p>
		</div>
		<div class="folders" v-if="folders.length > 0 || moreFolders">
			<x-folder class="folder" v-for="folder in folders" :key="folder.id" :folder="folder"/>
			<p v-if="moreFolders">{{ $t('@.load-more') }}</p>
		</div>
		<div class="files" v-if="files.length > 0 || moreFiles">
			<x-file class="file" v-for="file in files" :key="file.id" :file="file"/>
			<button class="more" v-if="moreFiles" @click="fetchMoreFiles">
				{{ fetchingMoreFiles ? this.$t('@.loading') : this.$t('@.load-more') }}
			</button>
		</div>
		<div class="empty" v-if="files.length == 0 && !moreFiles && folders.length == 0 && !moreFolders && !fetching">
			<p v-if="folder == null">{{ $t('nothing-in-drive') }}</p>
			<p v-if="folder != null">{{ $t('folder-is-empty') }}</p>
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
import i18n from '../../../i18n';
import XFolder from './drive.folder.vue';
import XFile from './drive.file.vue';
import XFileDetail from './drive.file-detail.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/components/drive.vue'),
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
	watch: {
		top() {
			if (this.isNaked) {
				(this.$refs.nav as any).style.top = `${this.top}px`;
			}
		}
	},
	mounted() {
		this.connection = this.$root.stream.useSharedConnection('drive');

		this.connection.on('fileCreated', this.onStreamDriveFileCreated);
		this.connection.on('fileUpdated', this.onStreamDriveFileUpdated);
		this.connection.on('fileDeleted', this.onStreamDriveFileDeleted);
		this.connection.on('folderCreated', this.onStreamDriveFolderCreated);
		this.connection.on('folderUpdated', this.onStreamDriveFolderUpdated);

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
		this.connection.dispose();
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

		onStreamDriveFileDeleted(fileId) {
			this.removeFile(fileId);
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
			if (target == null) {
				this.goRoot(silent);
				return;
			} else if (typeof target == 'object') {
				target = target.id;
			}

			this.file = null;
			this.fetching = true;

			this.$root.api('drive/folders/show', {
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
			// すでにrootにいるなら何もしない
			if (this.folder == null && this.file == null) return;
			
			this.file = null;
			this.folder = null;
			this.hierarchyFolders = [];
			this.$emit('move-root', silent);
			this.fetch();
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
			this.$root.api('drive/folders', {
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
			this.$root.api('drive/files', {
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
					for (const x of fetchedFolders) this.appendFolder(x);
					for (const x of fetchedFiles) this.appendFile(x);
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
				this.$root.api('drive').then(info => {
					this.info = info;
				});
			}
		},

		fetchMoreFiles() {
			this.fetching = true;
			this.fetchingMoreFiles = true;

			const max = 30;

			// ファイル一覧取得
			this.$root.api('drive/files', {
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
				for (const x of files) this.appendFile(x);
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

			this.$root.api('drive/files/show', {
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

		selectLocalFile() {
			(this.$refs.file as any).click();
		},

		createFolder() {
			this.$root.dialog({
				title: this.$t('folder-name'),
				input: {
					default: this.folder.name
				}
			}).then(({ result: name }) => {
				if (!name) {
					this.$root.dialog({
						type: 'error',
						text: this.$t('folder-name-cannot-empty')
					});
					return;
				}
				this.$root.api('drive/folders/create', {
					name: name,
					parentId: this.folder ? this.folder.id : undefined
				}).then(folder => {
					this.addFolder(folder, true);
				});
			});
		},

		renameFolder() {
			if (this.folder == null) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('here-is-root')
				});
				return;
			}
			this.$root.dialog({
				title: this.$t('folder-name'),
				input: {
					default: this.folder.name
				}
			}).then(({ result: name }) => {
				if (!name) {
					this.$root.dialog({
						type: 'error',
						text: this.$t('cannot-empty')
					});
					return;
				}
				this.$root.api('drive/folders/update', {
					name: name,
					folderId: this.folder.id
				}).then(folder => {
					this.cd(folder);
				});
			});
		},

		moveFolder() {
			if (this.folder == null) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('here-is-root')
				});
				return;
			}
			this.$chooseDriveFolder().then(folder => {
				this.$root.api('drive/folders/update', {
					parentId: folder ? folder.id : null,
					folderId: this.folder.id
				}).then(folder => {
					this.cd(folder);
				});
			});
		},

		urlUpload() {
			const url = window.prompt(this.$t('url-prompt'));
			if (url == null || url == '') return;
			this.$root.api('drive/files/upload_from_url', {
				url: url,
				folderId: this.folder ? this.folder.id : undefined
			});
			this.$root.dialog({
				type: 'info',
				text: this.$t('uploading')
			});
		},

		onChangeLocalFile() {
			for (const f of Array.from((this.$refs.file as any).files)) {
				(this.$refs.uploader as any).upload(f, this.folder);
			}
		},

		deleteFolder() {
			if (this.folder == null) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('here-is-root')
				});
				return;
			}
			this.$root.api('drive/folders/delete', {
				folderId: this.folder.id
			}).then(folder => {
				this.cd(this.folder.parentId);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.kmmwchoexgckptowjmjgfsygeltxfeqs
	background var(--face)

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
		color var(--text)
		-webkit-backdrop-filter blur(12px)
		backdrop-filter blur(12px)
		background-color var(--mobileDriveNavBg)
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

			> [data-icon]
				margin-right 4px

		> span
			margin 0 8px
			opacity 0.5

	> .browser
		&.fetching
			opacity 0.5

		> .info
			border-bottom solid 1px var(--faceDivider)

			&:empty
				display none

			> p
				display block
				max-width 500px
				margin 0 auto
				padding 4px 16px
				font-size 10px
				color var(--text)

		> .folders
			> .folder
				border-bottom solid 1px var(--faceDivider)

		> .files
			> .file
				border-bottom solid 1px var(--faceDivider)

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

		@keyframes sk-rotate {
			100% {
				transform: rotate(360deg);
			}
		}

		@keyframes sk-bounce {
			0%, 100% {
				transform: scale(0.0);
			}
			50% {
				transform: scale(1.0);
			}
		}

	> .file
		display none

</style>
