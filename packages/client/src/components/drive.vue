<template>
<div class="yfudmmck">
	<nav>
		<div class="path" @contextmenu.prevent.stop="() => {}">
			<XNavFolder :class="{ current: folder == null }"/>
			<template v-for="f in hierarchyFolders">
				<span class="separator"><i class="fas fa-angle-right"></i></span>
				<XNavFolder :folder="f"/>
			</template>
			<span class="separator" v-if="folder != null"><i class="fas fa-angle-right"></i></span>
			<span class="folder current" v-if="folder != null">{{ folder.name }}</span>
		</div>
		<button @click="showMenu" class="menu _button"><i class="fas fa-ellipsis-h"></i></button>
	</nav>
	<div class="main" :class="{ uploading: uploadings.length > 0, fetching }"
		ref="main"
		@dragover.prevent.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.prevent.stop="onDrop"
		@contextmenu.stop="onContextmenu"
	>
		<div class="contents" ref="contents">
			<div class="folders" ref="foldersContainer" v-show="folders.length > 0">
				<XFolder v-for="(f, i) in folders" :key="f.id" class="folder" :folder="f" :select-mode="select === 'folder'" :is-selected="selectedFolders.some(x => x.id === f.id)" @chosen="chooseFolder" v-anim="i"/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" v-for="(n, i) in 16" :key="i"></div>
				<MkButton ref="moreFolders" v-if="moreFolders">{{ $ts.loadMore }}</MkButton>
			</div>
			<div class="files" ref="filesContainer" v-show="files.length > 0">
				<XFile v-for="(file, i) in files" :key="file.id" class="file" :file="file" :select-mode="select === 'file'" :is-selected="selectedFiles.some(x => x.id === file.id)" @chosen="chooseFile" v-anim="i"/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div class="padding" v-for="(n, i) in 16" :key="i"></div>
				<MkButton ref="loadMoreFiles" @click="fetchMoreFiles" v-show="moreFiles">{{ $ts.loadMore }}</MkButton>
			</div>
			<div class="empty" v-if="files.length == 0 && folders.length == 0 && !fetching">
				<p v-if="draghover">{{ $t('empty-draghover') }}</p>
				<p v-if="!draghover && folder == null"><strong>{{ $ts.emptyDrive }}</strong><br/>{{ $t('empty-drive-description') }}</p>
				<p v-if="!draghover && folder != null">{{ $ts.emptyFolder }}</p>
			</div>
		</div>
		<MkLoading v-if="fetching"/>
	</div>
	<div class="dropzone" v-if="draghover"></div>
	<input ref="fileInput" type="file" accept="*/*" multiple="multiple" tabindex="-1" @change="onChangeFileInput"/>
</div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import XNavFolder from './drive.nav-folder.vue';
import XFolder from './drive.folder.vue';
import XFile from './drive.file.vue';
import MkButton from './ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNavFolder,
		XFolder,
		XFile,
		MkButton,
	},

	props: {
		initialFolder: {
			type: Object,
			required: false
		},
		type: {
			type: String,
			required: false,
			default: undefined
		},
		multiple: {
			type: Boolean,
			required: false,
			default: false
		},
		select: {
			type: String,
			required: false,
			default: null
		}
	},

	emits: ['selected', 'change-selection', 'move-root', 'cd', 'open-folder'],

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
			selectedFolders: [],
			uploadings: os.uploads,
			connection: null,

			/**
			 * ドロップされようとしているか
			 */
			draghover: false,

			/**
			 * 自信の所有するアイテムがドラッグをスタートさせたか
			 * (自分自身の階層にドロップできないようにするためのフラグ)
			 */
			isDragSource: false,

			fetching: true,

			ilFilesObserver: new IntersectionObserver(
				(entries) => entries.some((entry) => entry.isIntersecting)
				&& !this.fetching && this.moreFiles &&
					this.fetchMoreFiles()
			),
			moreFilesElement: null as Element,

		};
	},

	watch: {
		folder() {
			this.$emit('cd', this.folder);
		}
	},

	mounted() {
		if (this.$store.state.enableInfiniteScroll && this.$refs.loadMoreFiles) {
			this.$nextTick(() => {
				this.ilFilesObserver.observe((this.$refs.loadMoreFiles as Vue).$el)
			});
		}

		this.connection = markRaw(os.stream.useChannel('drive'));

		this.connection.on('fileCreated', this.onStreamDriveFileCreated);
		this.connection.on('fileUpdated', this.onStreamDriveFileUpdated);
		this.connection.on('fileDeleted', this.onStreamDriveFileDeleted);
		this.connection.on('folderCreated', this.onStreamDriveFolderCreated);
		this.connection.on('folderUpdated', this.onStreamDriveFolderUpdated);
		this.connection.on('folderDeleted', this.onStreamDriveFolderDeleted);

		if (this.initialFolder) {
			this.move(this.initialFolder);
		} else {
			this.fetch();
		}
	},

	activated() {
		if (this.$store.state.enableInfiniteScroll) {
			this.$nextTick(() => {
				this.ilFilesObserver.observe((this.$refs.loadMoreFiles as Vue).$el)
			});
		}
	},

	beforeUnmount() {
		this.connection.dispose();
		this.ilFilesObserver.disconnect();
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

		onStreamDriveFolderDeleted(folderId) {
			this.removeFolder(folderId);
		},

		onDragover(e): any {
			// ドラッグ元が自分自身の所有するアイテムだったら
			if (this.isDragSource) {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;
			const isDriveFolder = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FOLDER_;

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
				for (const file of Array.from(e.dataTransfer.files)) {
					this.upload(file, this.folder);
				}
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				if (this.files.some(f => f.id == file.id)) return;
				this.removeFile(file.id);
				os.api('drive/files/update', {
					fileId: file.id,
					folderId: this.folder ? this.folder.id : null
				});
			}
			//#endregion

			//#region ドライブのフォルダ
			const driveFolder = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);
			if (driveFolder != null && driveFolder != '') {
				const folder = JSON.parse(driveFolder);

				// 移動先が自分自身ならreject
				if (this.folder && folder.id == this.folder.id) return false;
				if (this.folders.some(f => f.id == folder.id)) return false;
				this.removeFolder(folder.id);
				os.api('drive/folders/update', {
					folderId: folder.id,
					parentId: this.folder ? this.folder.id : null
				}).then(() => {
					// noop
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							os.dialog({
								title: this.$ts.unableToProcess,
								text: this.$ts.circularReferenceFolder
							});
							break;
						default:
							os.dialog({
								type: 'error',
								text: this.$ts.somethingHappened
							});
					}
				});
			}
			//#endregion
		},

		selectLocalFile() {
			(this.$refs.fileInput as any).click();
		},

		urlUpload() {
			os.dialog({
				title: this.$ts.uploadFromUrl,
				input: {
					placeholder: this.$ts.uploadFromUrlDescription
				}
			}).then(({ canceled, result: url }) => {
				if (canceled) return;
				os.api('drive/files/upload-from-url', {
					url: url,
					folderId: this.folder ? this.folder.id : undefined
				});

				os.dialog({
					title: this.$ts.uploadFromUrlRequested,
					text: this.$ts.uploadFromUrlMayTakeTime
				});
			});
		},

		createFolder() {
			os.dialog({
				title: this.$ts.createFolder,
				input: {
					placeholder: this.$ts.folderName
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				os.api('drive/folders/create', {
					name: name,
					parentId: this.folder ? this.folder.id : undefined
				}).then(folder => {
					this.addFolder(folder, true);
				});
			});
		},

		renameFolder(folder) {
			os.dialog({
				title: this.$ts.renameFolder,
				input: {
					placeholder: this.$ts.inputNewFolderName,
					default: folder.name
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				os.api('drive/folders/update', {
					folderId: folder.id,
					name: name
				}).then(folder => {
					// FIXME: 画面を更新するために自分自身に移動
					this.move(folder);
				});
			});
		},

		deleteFolder(folder) {
			os.api('drive/folders/delete', {
				folderId: folder.id
			}).then(() => {
				// 削除時に親フォルダに移動
				this.move(folder.parentId);
			}).catch(err => {
				switch(err.id) {
					case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
						os.dialog({
							type: 'error',
							title: this.$ts.unableToDelete,
							text: this.$ts.hasChildFilesOrFolders
						});
						break;
					default:
						os.dialog({
							type: 'error',
							text: this.$ts.unableToDelete
						});
					}
			});
		},

		onChangeFileInput() {
			for (const file of Array.from((this.$refs.fileInput as any).files)) {
				this.upload(file, this.folder);
			}
		},

		upload(file, folder) {
			if (folder && typeof folder == 'object') folder = folder.id;
			os.upload(file, folder).then(res => {
				this.addFile(res, true);
			});
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

		chooseFolder(folder) {
			const isAlreadySelected = this.selectedFolders.some(f => f.id == folder.id);
			if (this.multiple) {
				if (isAlreadySelected) {
					this.selectedFolders = this.selectedFolders.filter(f => f.id != folder.id);
				} else {
					this.selectedFolders.push(folder);
				}
				this.$emit('change-selection', this.selectedFolders);
			} else {
				if (isAlreadySelected) {
					this.$emit('selected', folder);
				} else {
					this.selectedFolders = [folder];
					this.$emit('change-selection', [folder]);
				}
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

			os.api('drive/folders/show', {
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
				this.folders[exist] = folder;
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
				this.files[exist] = file;
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
			os.api('drive/folders', {
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
			os.api('drive/files', {
				folderId: this.folder ? this.folder.id : null,
				type: this.type,
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
				} else {
					flag = true;
				}
			};
		},

		fetchMoreFiles() {
			this.fetching = true;

			const max = 30;

			// ファイル一覧取得
			os.api('drive/files', {
				folderId: this.folder ? this.folder.id : null,
				type: this.type,
				untilId: this.files[this.files.length - 1].id,
				limit: max + 1
			}).then(files => {
				if (files.length == max + 1) {
					this.moreFiles = true;
					files.pop();
				} else {
					this.moreFiles = false;
				}
				for (const x of files) this.appendFile(x);
				this.fetching = false;
			});
		},

		getMenu() {
			return [{
				text: this.$ts.addFile,
				type: 'label'
			}, {
				text: this.$ts.upload,
				icon: 'fas fa-upload',
				action: () => { this.selectLocalFile(); }
			}, {
				text: this.$ts.fromUrl,
				icon: 'fas fa-link',
				action: () => { this.urlUpload(); }
			}, null, {
				text: this.folder ? this.folder.name : this.$ts.drive,
				type: 'label'
			}, this.folder ? {
				text: this.$ts.renameFolder,
				icon: 'fas fa-i-cursor',
				action: () => { this.renameFolder(this.folder); }
			} : undefined, this.folder ? {
				text: this.$ts.deleteFolder,
				icon: 'fas fa-trash-alt',
				action: () => { this.deleteFolder(this.folder); }
			} : undefined, {
				text: this.$ts.createFolder,
				icon: 'fas fa-folder-plus',
				action: () => { this.createFolder(); }
			}];
		},

		showMenu(ev) {
			os.popupMenu(this.getMenu(), ev.currentTarget || ev.target);
		},

		onContextmenu(ev) {
			os.contextMenu(this.getMenu(), ev);
		},
	}
});
</script>

<style lang="scss" scoped>
.yfudmmck {
	display: flex;
	flex-direction: column;
	height: 100%;

	> nav {
		display: flex;
		z-index: 2;
		width: 100%;
		padding: 0 8px;
		box-sizing: border-box;
		overflow: auto;
		font-size: 0.9em;
		box-shadow: 0 1px 0 var(--divider);

		&, * {
			user-select: none;
		}

		> .path {
			display: inline-block;
			vertical-align: bottom;
			line-height: 38px;
			white-space: nowrap;

			> * {
				display: inline-block;
				margin: 0;
				padding: 0 8px;
				line-height: 38px;
				cursor: pointer;

				* {
					pointer-events: none;
				}

				&:hover {
					text-decoration: underline;
				}

				&.current {
					font-weight: bold;
					cursor: default;

					&:hover {
						text-decoration: none;
					}
				}

				&.separator {
					margin: 0;
					padding: 0;
					opacity: 0.5;
					cursor: default;

					> i {
						margin: 0;
					}
				}
			}
		}

		> .menu {
			margin-left: auto;
		}
	}

	> .main {
		flex: 1;
		overflow: auto;
		padding: var(--margin);

		&, * {
			user-select: none;
		}

		&.fetching {
			cursor: wait !important;

			* {
				pointer-events: none;
			}

			> .contents {
				opacity: 0.5;
			}
		}

		&.uploading {
			height: calc(100% - 38px - 100px);
		}

		> .contents {

			> .folders,
			> .files {
				display: flex;
				flex-wrap: wrap;

				> .folder,
				> .file {
					flex-grow: 1;
					width: 128px;
					margin: 4px;
					box-sizing: border-box;
				}

				> .padding {
					flex-grow: 1;
					pointer-events: none;
					width: 128px + 8px;
				}
			}

			> .empty {
				padding: 16px;
				text-align: center;
				pointer-events: none;
				opacity: 0.5;

				> p {
					margin: 0;
				}
			}
		}
	}

	> .dropzone {
		position: absolute;
		left: 0;
		top: 38px;
		width: 100%;
		height: calc(100% - 38px);
		border: dashed 2px var(--focus);
		pointer-events: none;
	}

	> input {
		display: none;
	}
}
</style>
