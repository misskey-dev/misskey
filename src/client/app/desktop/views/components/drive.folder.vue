<template>
<div class="root folder"
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
		<template v-if="hover">%fa:R folder-open .fw%</template>
		<template v-if="!hover">%fa:R folder .fw%</template>
		{{ folder.name }}
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import contextmenu from '../../api/contextmenu';

export default Vue.extend({
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
			contextmenu((this as any).os)(e, [{
				type: 'item',
				text: '%i18n:@contextmenu.move-to-this-folder%',
				icon: '%fa:arrow-right%',
				action: this.go
			}, {
				type: 'item',
				text: '%i18n:@contextmenu.show-in-new-window%',
				icon: '%fa:R window-restore%',
				action: this.newWindow
			}, null, {
				type: 'item',
				text: '%i18n:@contextmenu.rename%',
				icon: '%fa:i-cursor%',
				action: this.rename
			}, null, {
				type: 'item',
				text: '%i18n:common.delete%',
				icon: '%fa:R trash-alt%',
				action: this.deleteFolder
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
				Array.from(e.dataTransfer.files).forEach(file => {
					this.browser.upload(file, this.folder);
				});
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.browser.removeFile(file.id);
				(this as any).api('drive/files/update', {
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
				(this as any).api('drive/folders/update', {
					folderId: folder.id,
					parentId: this.folder.id
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
			(this as any).apis.input({
				title: '%i18n:@contextmenu.rename-folder%',
				placeholder: '%i18n:@contextmenu.input-new-folder-name%',
				default: this.folder.name
			}).then(name => {
				(this as any).api('drive/folders/update', {
					folderId: this.folder.id,
					name: name
				});
			});
		},

		deleteFolder() {
			alert('not implemented yet');
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.root.folder
	padding 8px
	height 64px
	background lighten($theme-color, 95%)
	border-radius 4px

	&, *
		cursor pointer

	*
		pointer-events none

	&:hover
		background lighten($theme-color, 90%)

	&:active
		background lighten($theme-color, 85%)

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
			border 2px dashed rgba($theme-color, 0.3)
			border-radius 4px

	&[data-draghover]
		background lighten($theme-color, 90%)

	> .name
		margin 0
		font-size 0.9em
		color darken($theme-color, 30%)

		> [data-fa]
			margin-right 4px
			margin-left 2px
			text-align left

</style>
