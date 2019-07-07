<template>
<div class="ynntpczxvnusfwdyxsfuhvcmuypqopdd"
	:data-is-contextmenu-showing="isContextmenuShowing"
	:data-draghover="draghover"
	@click="onClick"
	@mouseover="onMouseover"
	@mouseout="onMouseout"
	@dragover.prevent.stop="onDragover"
	@dragenter.prevent="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
	@contextmenu.prevent.stop="onContextmenu"
	:title="title"
>
	<p class="name">
		<template v-if="hover"><fa :icon="['far', 'folder-open']" fixed-width/></template>
		<template v-if="!hover"><fa :icon="['far', 'folder']" fixed-width/></template>
		{{ folder.name }}
	</p>
	<p class="upload" v-if="$store.state.settings.uploadFolder == folder.id">
		{{ $t('upload-folder') }}
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/drive.folder.vue'),
	props: ['folder'],
	data() {
		return {
			hover: false,
			draghover: false,
			isDragging: false,
			isContextmenuShowing: false
		};
	},
	computed: {
		browser(): any {
			return this.$parent;
		},
		title(): string {
			return this.folder.name;
		}
	},
	methods: {
		onClick() {
			this.browser.move(this.folder);
		},

		onContextmenu(e) {
			this.isContextmenuShowing = true;
			this.$contextmenu(e, [{
				type: 'item',
				text: this.$t('contextmenu.move-to-this-folder'),
				icon: 'arrow-right',
				action: this.go
			}, {
				type: 'item',
				text: this.$t('contextmenu.show-in-new-window'),
				icon: ['far', 'window-restore'],
				action: this.newWindow
			}, null, {
				type: 'item',
				text: this.$t('contextmenu.rename'),
				icon: 'i-cursor',
				action: this.rename
			}, null, {
				type: 'item',
				text: this.$t('@.delete'),
				icon: ['far', 'trash-alt'],
				action: this.deleteFolder
			}, null, {
				type: 'nest',
				text: this.$t('contextmenu.else-folders'),
				menu: [{
					type: 'item',
					text: this.$t('contextmenu.set-as-upload-folder'),
					action: this.setAsUploadFolder
				}]
			}], {
				closed: () => {
					this.isContextmenuShowing = false;
				}
			});
		},

		onMouseover() {
			this.hover = true;
		},

		onMouseout() {
			this.hover = false
		},

		onDragover(e) {
			// 自分自身がドラッグされている場合
			if (this.isDragging) {
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
		},

		onDragenter() {
			if (!this.isDragging) this.draghover = true;
		},

		onDragleave() {
			this.draghover = false;
		},

		onDrop(e) {
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				for (const file of Array.from(e.dataTransfer.files)) {
					this.browser.upload(file, this.folder);
				}
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.browser.removeFile(file.id);
				this.$root.api('drive/files/update', {
					fileId: file.id,
					folderId: this.folder.id
				});
			}
			//#endregion

			//#region ドライブのフォルダ
			const driveFolder = e.dataTransfer.getData('mk_drive_folder');
			if (driveFolder != null && driveFolder != '') {
				const folder = JSON.parse(driveFolder);

				// 移動先が自分自身ならreject
				if (folder.id == this.folder.id) return;

				this.browser.removeFolder(folder.id);
				this.$root.api('drive/folders/update', {
					folderId: folder.id,
					parentId: this.folder.id
				}).then(() => {
					// noop
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							this.$root.dialog({
								title: this.$t('unable-to-process'),
								text: this.$t('circular-reference-detected')
							});
							break;
						default:
							this.$root.dialog({
								type: 'error',
								text: this.$t('unhandled-error')
							});
					}
				});
			}
			//#endregion
		},

		onDragstart(e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('mk_drive_folder', JSON.stringify(this.folder));
			this.isDragging = true;

			// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
			// (=あなたの子供が、ドラッグを開始しましたよ)
			this.browser.isDragSource = true;
		},

		onDragend() {
			this.isDragging = false;
			this.browser.isDragSource = false;
		},

		go() {
			this.browser.move(this.folder.id);
		},

		newWindow() {
			this.browser.newWindow(this.folder);
		},

		rename() {
			this.$root.dialog({
				title: this.$t('contextmenu.rename-folder'),
				input: {
					placeholder: this.$t('contextmenu.input-new-folder-name'),
					default: this.folder.name
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				this.$root.api('drive/folders/update', {
					folderId: this.folder.id,
					name: name
				});
			});
		},

		deleteFolder() {
			this.$root.api('drive/folders/delete', {
				folderId: this.folder.id
			}).then(() => {
				if (this.$store.state.settings.uploadFolder === this.folder.id) {
					this.$store.dispatch('settings/set', {
						key: 'uploadFolder',
						value: null
					});
				}
			}).catch(err => {
				switch(err.id) {
					case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
						this.$root.dialog({
							type: 'error',
							title: this.$t('unable-to-delete'),
							text: this.$t('has-child-files-or-folders')
						});
						break;
					default:
						this.$root.dialog({
							type: 'error',
							text: this.$t('unable-to-delete')
						});
				}
			});
		},

		setAsUploadFolder() {
			this.$store.dispatch('settings/set', {
				key: 'uploadFolder',
				value: this.folder.id
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.ynntpczxvnusfwdyxsfuhvcmuypqopdd
	padding 8px
	height 64px
	background var(--desktopDriveFolderBg)
	border-radius 4px

	&, *
		cursor pointer

	*
		pointer-events none

	&:hover
		background var(--desktopDriveFolderHoverBg)

	&:active
		background var(--desktopDriveFolderActiveBg)

	&[data-is-contextmenu-showing]
	&[data-draghover]
		&:after
			content ""
			pointer-events none
			position absolute
			top -4px
			right -4px
			bottom -4px
			left -4px
			border 2px dashed var(--primaryAlpha03)
			border-radius 4px

	&[data-draghover]
		background var(--desktopDriveFolderActiveBg)

	> .name
		margin 0
		font-size 0.9em
		color var(--desktopDriveFolderFg)

		> [data-icon]
			margin-right 4px
			margin-left 2px
			text-align left

	> .upload
		margin 4px 4px
		font-size 0.8em
		text-align right
		color var(--desktopDriveFolderFg)

</style>
