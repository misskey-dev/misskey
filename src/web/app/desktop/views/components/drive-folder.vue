<template>
<div class="mk-drive-folder"
	:data-is-contextmenu-showing="isContextmenuShowing"
	:data-draghover="draghover"
	@click="onClick"
	@mouseover="onMouseover"
	@mouseout="onMouseout"
	@dragover.prevent.stop="onDragover"
	@dragenter.prevent="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	@contextmenu.prevent.stop="onContextmenu"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
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
import dialog from '../../scripts/dialog';

export default Vue.extend({
	props: ['folder', 'browser'],
	data() {
		return {
			hover: false,
			draghover: false,
			isDragging: false,
			isContextmenuShowing: false
		};
	},
	computed: {
		title(): string {
			return this.folder.name;
		}
	},
	methods: {
		onClick() {
			this.browser.move(this.folder);
		},

		onMouseover() {
			this.hover = true;
		},

		onMouseout() {
			this.hover = false
		},

		onDragover(e) {
			// 自分自身がドラッグされていない場合
			if (!this.isDragging) {
				// ドラッグされてきたものがファイルだったら
				if (e.dataTransfer.effectAllowed === 'all') {
					e.dataTransfer.dropEffect = 'copy';
				} else {
					e.dataTransfer.dropEffect = 'move';
				}
			} else {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
			}
			return false;
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
				return false;
			};

			// データ取得
			const data = e.dataTransfer.getData('text');
			if (data == null) return false;

			// パース
			// TODO: Validate JSON
			const obj = JSON.parse(data);

			// (ドライブの)ファイルだったら
			if (obj.type == 'file') {
				const file = obj.id;
				this.browser.removeFile(file);
				this.$root.$data.os.api('drive/files/update', {
					file_id: file,
					folder_id: this.folder.id
				});
			// (ドライブの)フォルダーだったら
			} else if (obj.type == 'folder') {
				const folder = obj.id;
				// 移動先が自分自身ならreject
				if (folder == this.folder.id) return false;
				this.browser.removeFolder(folder);
				this.$root.$data.os.api('drive/folders/update', {
					folder_id: folder,
					parent_id: this.folder.id
				}).then(() => {
					// something
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							dialog('%fa:exclamation-triangle%%i18n:desktop.tags.mk-drive-browser-folder.unable-to-process%',
								'%i18n:desktop.tags.mk-drive-browser-folder.circular-reference-detected%', [{
								text: '%i18n:common.ok%'
							}]);
							break;
						default:
							alert('%i18n:desktop.tags.mk-drive-browser-folder.unhandled-error% ' + err);
					}
				});
			}

			return false;
		},

		onDragstart(e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text', JSON.stringify({
				type: 'folder',
				id: this.folder.id
			}));
			this.isDragging = true;

			// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
			// (=あなたの子供が、ドラッグを開始しましたよ)
			this.browser.isDragSource = true;
		},

		onDragend() {
			this.isDragging = false;
			this.browser.isDragSource = false;
		},

		onContextmenu(e) {
			this.isContextmenuShowing = true;
			const ctx = new MkDriveFolderContextmenu({
				parent: this,
				propsData: {
					browser: this.browser,
					x: e.pageX - window.pageXOffset,
					y: e.pageY - window.pageYOffset
				}
			}).$mount();
			ctx.$once('closed', () => {
				this.isContextmenuShowing = false;
			});
			document.body.appendChild(ctx.$el);
			return false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-drive-folder
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
