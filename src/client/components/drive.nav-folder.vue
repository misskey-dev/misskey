<template>
<div class="drylbebk"
	:class="{ draghover }"
	@click="onClick"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<i v-if="folder == null"><Fa :icon="faCloud"/></i>
	<span>{{ folder == null ? $t('drive') : folder.name }}</span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	props: {
		folder: {
			type: Object,
			required: false,
		}
	},

	data() {
		return {
			hover: false,
			draghover: false,
			faCloud
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
				for (const file of Array.from(e.dataTransfer.files)) {
					this.browser.upload(file, this.folder);
				}
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.browser.removeFile(file.id);
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
				if (this.folder && folder.id == this.folder.id) return;
				this.browser.removeFolder(folder.id);
				os.api('drive/folders/update', {
					folderId: folder.id,
					parentId: this.folder ? this.folder.id : null
				});
			}
			//#endregion
		}
	}
});
</script>

<style lang="scss" scoped>
.drylbebk {
	> * {
		pointer-events: none;
	}

	&.draghover {
		background: #eee;
	}

	> i {
		margin-right: 4px;
	}
}
</style>
