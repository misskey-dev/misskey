<template>
<div class="drylbebk"
	:class="{ draghover }"
	@click="onClick"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<i v-if="folder == null" class="fas fa-cloud"></i>
	<span>{{ folder == null ? i18n.ts.drive : folder.name }}</span>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	folder?: Misskey.entities.DriveFolder;
	parentFolder: Misskey.entities.DriveFolder | null;
}>();

const emit = defineEmits<{
	(e: 'move', v?: Misskey.entities.DriveFolder): void;
	(e: 'upload', file: File, folder?: Misskey.entities.DriveFolder | null): void;
	(e: 'removeFile', v: Misskey.entities.DriveFile['id']): void;
	(e: 'removeFolder', v: Misskey.entities.DriveFolder['id']): void;
}>();

const hover = ref(false);
const draghover = ref(false);

function onClick() {
	emit('move', props.folder);
}

function onMouseover() {
	hover.value = true;
}

function onMouseout() {
	hover.value = false;
}

function onDragover(e: DragEvent) {
	if (!e.dataTransfer) return;

	// このフォルダがルートかつカレントディレクトリならドロップ禁止
	if (props.folder == null && props.parentFolder == null) {
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
}

function onDragenter() {
	if (props.folder || props.parentFolder) draghover.value = true;
}

function onDragleave() {
	if (props.folder || props.parentFolder) draghover.value = false;
}

function onDrop(e: DragEvent) {
	draghover.value = false;

	if (!e.dataTransfer) return;

	// ファイルだったら
	if (e.dataTransfer.files.length > 0) {
		for (const file of Array.from(e.dataTransfer.files)) {
			emit('upload', file, props.folder);
		}
		return;
	}

	//#region ドライブのファイル
	const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile != '') {
		const file = JSON.parse(driveFile);
		emit('removeFile', file.id);
		os.api('drive/files/update', {
			fileId: file.id,
			folderId: props.folder ? props.folder.id : null
		});
	}
	//#endregion

	//#region ドライブのフォルダ
	const driveFolder = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);
	if (driveFolder != null && driveFolder != '') {
		const folder = JSON.parse(driveFolder);
		// 移動先が自分自身ならreject
		if (props.folder && folder.id == props.folder.id) return;
		emit('removeFolder', folder.id);
		os.api('drive/folders/update', {
			folderId: folder.id,
			parentId: props.folder ? props.folder.id : null
		});
	}
	//#endregion
}
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
