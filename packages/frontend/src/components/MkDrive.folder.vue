<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.draghover]: draghover }]"
	draggable="true"
	:title="title"
	@contextmenu.stop="onContextmenu"
	@mouseover="onMouseover"
	@mouseout="onMouseout"
	@dragover.prevent.stop="onDragover"
	@dragenter.prevent="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<svg :class="[$style.shape]" viewBox="0 0 200 150" preserveAspectRatio="none">
		<path d="M190,25C195.523,25 200,29.477 200,35C200,58.415 200,116.585 200,140C200,145.523 195.523,150 190,150C155.86,150 44.14,150 10,150C4.477,150 0,145.523 0,140C0,112.727 0,37.273 0,10C0,4.477 4.477,0 10,-0C26.642,0 59.332,0 70.858,0C73.51,-0 76.054,1.054 77.929,2.929C82.74,7.74 92.26,17.26 97.071,22.071C98.946,23.946 101.49,25 104.142,25C118.808,25 168.535,25 190,25Z" style="fill:var(--MI_THEME-accentedBg);"/>
	</svg>
	<div :class="$style.name">{{ folder.name }}</div>
	<div v-if="prefer.s.uploadFolder == folder.id" :class="$style.upload">
		{{ i18n.ts.uploadFolder }}
	</div>
	<button v-if="selectMode" class="_button" :class="$style.checkboxWrapper" @click.prevent.stop="checkboxClicked">
		<div :class="[$style.checkbox, { [$style.checked]: isSelected, 'ti ti-check': isSelected }]"></div>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { claimAchievement } from '@/utility/achievements.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { prefer } from '@/preferences.js';
import { globalEvents } from '@/events.js';
import { checkDragDataType, getDragData, setDragData } from '@/drag-and-drop.js';
import { selectDriveFolder } from '@/utility/drive.js';

const props = withDefaults(defineProps<{
	folder: Misskey.entities.DriveFolder;
	isSelected?: boolean;
	selectMode?: boolean;
}>(), {
	isSelected: false,
	selectMode: false,
});

const emit = defineEmits<{
	(ev: 'chosen', v: Misskey.entities.DriveFolder): void;
	(ev: 'unchose', v: Misskey.entities.DriveFolder): void;
	(ev: 'upload', files: File[], folder: Misskey.entities.DriveFolder): void;
	(ev: 'dragstart'): void;
	(ev: 'dragend'): void;
}>();

const hover = ref(false);
const draghover = ref(false);
const isDragging = ref(false);

const title = computed(() => props.folder.name);

function checkboxClicked() {
	if (props.isSelected) {
		emit('unchose', props.folder);
	} else {
		emit('chosen', props.folder);
	}
}

function onMouseover() {
	hover.value = true;
}

function onMouseout() {
	hover.value = false;
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// 自分自身がドラッグされている場合
	if (isDragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
		return;
	}

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles', 'driveFolders'])) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}
}

function onDragenter() {
	if (!isDragging.value) draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		emit('upload', Array.from(ev.dataTransfer.files), props.folder);
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			misskeyApi('drive/files/move-bulk', {
				fileIds: droppedData.map(f => f.id),
				folderId: props.folder.id,
			}).then(() => {
				globalEvents.emit('driveFilesUpdated', droppedData.map(x => ({
					...x,
					folderId: props.folder.id,
					folder: props.folder,
				})));
			});
		}
	}
	//#endregion

	//#region ドライブのフォルダ
	{
		const droppedData = getDragData(ev, 'driveFolders');
		if (droppedData != null) {
			const droppedFolder = droppedData[0];

			// 移動先が自分自身ならreject
			if (droppedFolder.id === props.folder.id) return;

			misskeyApi('drive/folders/update', {
				folderId: droppedFolder.id,
				parentId: props.folder.id,
			}).then(() => {
				globalEvents.emit('driveFoldersUpdated', [droppedFolder].map(x => ({
					...x,
					parentId: props.folder.id,
					parent: props.folder,
				})));
			}).catch(err => {
				switch (err.code) {
					case 'RECURSIVE_NESTING':
						claimAchievement('driveFolderCircularReference');
						os.alert({
							type: 'error',
							title: i18n.ts.unableToProcess,
							text: i18n.ts.circularReferenceFolder,
						});
						break;
					default:
						os.alert({
							type: 'error',
							text: i18n.ts.somethingHappened,
						});
				}
			});
		}
	}
	//#endregion
}

function onDragstart(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'driveFolders', [props.folder]);
	isDragging.value = true;

	// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
	// (=あなたの子供が、ドラッグを開始しましたよ)
	emit('dragstart');
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}

function rename() {
	os.inputText({
		title: i18n.ts.renameFolder,
		placeholder: i18n.ts.inputNewFolderName,
		default: props.folder.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		misskeyApi('drive/folders/update', {
			folderId: props.folder.id,
			name: name,
		}).then(() => {
			globalEvents.emit('driveFoldersUpdated', [{
				...props.folder,
				name: name,
			}]);
		});
	});
}

function move() {
	selectDriveFolder(null).then(({ canceled, folders }) => {
		if (canceled || (folders[0] && folders[0].id === props.folder.id)) return;

		misskeyApi('drive/folders/update', {
			folderId: props.folder.id,
			parentId: folders[0] ? folders[0].id : null,
		}).then(() => {
			globalEvents.emit('driveFoldersUpdated', [{
				...props.folder,
				parentId: folders[0] ? folders[0].id : null,
				parent: folders[0] ?? null,
			}]);
		});
	});
}

function deleteFolder() {
	misskeyApi('drive/folders/delete', {
		folderId: props.folder.id,
	}).then(() => {
		if (prefer.s.uploadFolder === props.folder.id) {
			prefer.commit('uploadFolder', null);
		}
		globalEvents.emit('driveFoldersDeleted', [props.folder]);
	}).catch(err => {
		switch (err.id) {
			case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
				os.alert({
					type: 'error',
					title: i18n.ts.unableToDelete,
					text: i18n.ts.hasChildFilesOrFolders,
				});
				break;
			default:
				os.alert({
					type: 'error',
					text: i18n.ts.unableToDelete,
				});
		}
	});
}

function setAsUploadFolder() {
	prefer.commit('uploadFolder', props.folder.id);
}

function onContextmenu(ev: PointerEvent) {
	let menu: MenuItem[];
	menu = [{
		text: i18n.ts.openInWindow,
		icon: 'ti ti-app-window',
		action: async () => {
			const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkDriveWindow.vue').then(x => x.default), {
				initialFolder: props.folder,
			}, {
				closed: () => dispose(),
			});
		},
	}, { type: 'divider' }, {
		text: i18n.ts.rename,
		icon: 'ti ti-forms',
		action: rename,
	}, {
		text: i18n.ts.move,
		icon: 'ti ti ti-folder-symlink',
		action: move,
	}, { type: 'divider' }, {
		text: i18n.ts.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: deleteFolder,
	}];
	if (prefer.s.devMode) {
		menu = menu.concat([{ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: i18n.ts.copyFolderId,
			action: () => {
				copyToClipboard(props.folder.id);
			},
		}]);
	}
	os.contextMenu(menu, ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	height: 90px;
	padding: 24px 16px;
	box-sizing: border-box;
	cursor: pointer;

	&.draghover {
		&::after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -4px;
			right: -4px;
			bottom: -4px;
			left: -4px;
			border: 2px dashed var(--MI_THEME-focus);
			border-radius: 4px;
		}
	}
}

.shape {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.checkboxWrapper {
	position: absolute;
	border-radius: 50%;
	bottom: 2px;
	right: 2px;
	padding: 8px;
	box-sizing: border-box;

	> .checkbox {
		position: relative;
		width: 18px;
		height: 18px;
		background: #fff;
		border: solid 2px var(--MI_THEME-divider);
		border-radius: 4px;
		box-sizing: border-box;

		&.checked {
			border-color: var(--MI_THEME-accent);
			background: var(--MI_THEME-accent);

			&::before {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				color: #fff;
				font-size: 12px;
				line-height: 18px;
			}
		}
	}

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.name {
	font-size: 0.9em;
}

.icon {
	margin-right: 4px;
	margin-left: 2px;
	text-align: left;
}

.upload {
	font-size: 0.8em;
	text-align: right;
}
</style>
