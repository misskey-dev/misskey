<template>
<div class="root nav-folder"
	:data-draghover="draghover"
	@click="onClick"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<template v-if="folder == null">%fa:cloud%</template>
	<span>{{ folder == null ? '%i18n:desktop.tags.mk-drive-browser-nav-folder.drive%' : folder.name }}</span>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['folder'],
	data() {
		return {
			hover: false,
			draghover: false
		};
	},
	computed: {
		browser(): any {
			return this.$parent;
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
			this.hover = false;
		},
		onDragover(e) {
			// このフォルダがルートかつカレントディレクトリならドロップ禁止
			if (this.folder == null && this.browser.folder == null) {
				e.dataTransfer.dropEffect = 'none';
			// ドラッグされてきたものがファイルだったら
			} else if (e.dataTransfer.effectAllowed == 'all') {
				e.dataTransfer.dropEffect = 'copy';
			} else {
				e.dataTransfer.dropEffect = 'move';
			}
			return false;
		},
		onDragenter() {
			if (this.folder || this.browser.folder) this.draghover = true;
		},
		onDragleave() {
			if (this.folder || this.browser.folder) this.draghover = false;
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
				(this as any).api('drive/files/update', {
					file_id: file,
					folder_id: this.folder ? this.folder.id : null
				});
			// (ドライブの)フォルダーだったら
			} else if (obj.type == 'folder') {
				const folder = obj.id;
				// 移動先が自分自身ならreject
				if (this.folder && folder == this.folder.id) return false;
				this.browser.removeFolder(folder);
				(this as any).api('drive/folders/update', {
					folder_id: folder,
					parent_id: this.folder ? this.folder.id : null
				});
			}

			return false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.nav-folder
	&[data-draghover]
		background #eee

</style>
