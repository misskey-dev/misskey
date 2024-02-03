<template>
<div class="_gaps">
	<MkFolder>
		<template #icon><i class="ti ti-settings"></i></template>
		<template #label>アップロード設定</template>
		<template #caption>この画面で絵文字アップロードを行う際の動作を設定できます。</template>

		<div class="_gaps">
			<MkSelect v-model="selectedFolderId">
				<template #label>{{ i18n.ts.uploadFolder }}</template>
				<option v-for="folder in uploadFolders" :key="folder.id" :value="folder.id">
					{{ folder.name }}
				</option>
			</MkSelect>

			<MkSwitch v-model="keepOriginalUploading">
				<template #label>{{ i18n.ts.keepOriginalUploading }}</template>
				<template #caption>{{ i18n.ts.keepOriginalUploadingDescription }}</template>
			</MkSwitch>

			<MkSwitch v-model="directoryToCategory">
				<template #label>ディレクトリ名を"category"に入力する</template>
				<template #caption>ディレクトリをドラッグ・ドロップした時に、ディレクトリ名を"category"に入力します。</template>
			</MkSwitch>
		</div>
	</MkFolder>

	<MkFolder>
		<template #icon><i class="ti ti-notes"></i></template>
		<template #label>登録ログ</template>
		<template #caption>
			絵文字登録時のログが表示されます。登録操作を行ったり、ページをリロードすると消えます。
		</template>

		<div>
			<div v-if="registerLogs.length > 0" style="overflow-y: scroll;">
				<MkGrid
					:gridSetting="{ rowNumberVisible: false }"
					:data="registerLogs"
					:columnSettings="registerLogColumnSettings"
				/>
			</div>
			<div v-else>
				ログはありません。
			</div>
		</div>
	</MkFolder>

	<div
		:class="$style.uploadBox"
		@dragover.prevent
		@drop.prevent.stop="onDrop"
	>
		<div style="margin-top: 1em">
			いずれかの方法で登録する絵文字を選択してください。
		</div>
		<ul>
			<li>この枠に画像ファイルまたはディレクトリをドラッグ＆ドロップ</li>
			<li><a @click.prevent="onFileSelectClicked">このリンクをクリックしてPCから選択する</a></li>
			<li><a @click.prevent="onDriveSelectClicked">このリンクをクリックしてドライブから選択する</a></li>
		</ul>
	</div>

	<div
		v-if="gridItems.length > 0"
		style="overflow-y: scroll;"
	>
		<MkGrid
			:data="gridItems"
			:columnSettings="columnSettings"
			@event="onGridEvent"
		/>
	</div>

	<div
		v-if="gridItems.length > 0"
		:class="$style.buttons"
	>
		<MkButton primary :disabled="registerButtonDisabled" @click="onRegistryClicked">
			{{ i18n.ts.registration }}
		</MkButton>
		<MkButton @click="onClearClicked">
			{{ i18n.ts.clear }}
		</MkButton>
	</div>
</div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { onMounted, ref } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fromDriveFile, GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { defaultStore } from '@/store.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { required } from '@/components/grid/cell-validators.js';
import { chooseFileFromDrive, chooseFileFromPc } from '@/scripts/select-file.js';
import { uploadFile } from '@/scripts/upload.js';
import {
	GridCellContextMenuEvent,
	GridCellValidationEvent,
	GridCellValueChangeEvent,
	GridCurrentState,
	GridEvent,
	GridKeyDownEvent,
	GridRowContextMenuEvent,
} from '@/components/grid/grid-event.js';
import { ColumnSetting } from '@/components/grid/column.js';
import { extractDroppedItems, flattenDroppedFiles } from '@/scripts/file-drop.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';

const MAXIMUM_EMOJI_COUNT = 100;

type FolderItem = {
	id?: string;
	name: string;
};

type UploadResult = {
	key: string,
	item: GridItem,
	success: boolean,
	err?: Error
};

type RegisterLogItem = {
	failed: boolean;
	url: string;
	name: string;
	error?: string;
};

const columnSettings: ColumnSetting[] = [
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto', validators: [required] },
	{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140, validators: [required] },
	{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
	{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
	{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
	{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 100 },
];

const registerLogColumnSettings: ColumnSetting[] = [
	{ bindTo: 'failed', title: 'failed', type: 'boolean', editable: false, width: 50 },
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
	{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 140 },
	{ bindTo: 'error', title: 'log', type: 'text', editable: false, width: 'auto' },
];

const emit = defineEmits<{
	(ev: 'operation:registered'): void;
}>();

const uploadFolders = ref<FolderItem[]>([]);
const gridItems = ref<GridItem[]>([]);
const selectedFolderId = ref(defaultStore.state.uploadFolder);
const keepOriginalUploading = ref(defaultStore.state.keepOriginalUploading);
const directoryToCategory = ref<boolean>(true);

const registerButtonDisabled = ref<boolean>(false);
const registerLogs = ref<RegisterLogItem[]>([]);

async function onRegistryClicked() {
	const dialogSelection = await os.confirm({
		type: 'info',
		title: '確認',
		text: 'リストに表示されている絵文字を新たなカスタム絵文字として登録します。よろしいですか？',
	});

	if (dialogSelection.canceled) {
		return;
	}

	const items = new Map<string, GridItem>(gridItems.value.map(it => [`${it.fileId}|${it.name}`, it]));
	const upload = async (): Promise<UploadResult[]> => {
		const result = Array.of<UploadResult>();
		for (const [key, item] of items.entries()) {
			try {
				await misskeyApi('admin/emoji/add', {
					name: item.name,
					category: item.category,
					aliases: item.aliases.split(',').map(it => it.trim()),
					license: item.license,
					isSensitive: item.isSensitive,
					localOnly: item.localOnly,
					roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.split(',').map(it => it.trim()),
					fileId: item.fileId!,
				});
				result.push({ key, item, success: true, err: undefined });
			} catch (err: any) {
				result.push({ key, item, success: false, err });
			}
		}
		return result;
	};

	const result = await os.promiseDialog(upload());
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: 'エラー',
			text: '絵文字の登録に失敗しました。詳細は登録ログをご確認ください。',
		});
	}

	registerLogs.value = result.map(it => ({
		failed: !it.success,
		url: it.item.url,
		name: it.item.name,
		error: it.err ? JSON.stringify(it.err) : undefined,
	}));
	gridItems.value = failedItems.map(it => it.item);

	emit('operation:registered');
}

async function onClearClicked() {
	const result = await os.confirm({
		type: 'warning',
		title: '確認',
		text: '編集内容を破棄し、リストに表示されている絵文字をクリアします。よろしいですか？',
	});

	if (!result.canceled) {
		gridItems.value = [];
	}
}

async function onDrop(ev: DragEvent) {
	const droppedFiles = await extractDroppedItems(ev).then(it => flattenDroppedFiles(it));
	if (droppedFiles.length + gridItems.value.length >= MAXIMUM_EMOJI_COUNT) {
		await os.alert({
			type: 'warning',
			title: '確認',
			text: `一度に登録できる絵文字の数は${MAXIMUM_EMOJI_COUNT}件までです。この数を超過した分はリストアップされずに切り捨てられます。`,
		});
	}

	const uploadedItems = await Promise.all(
		droppedFiles.map(async (it) => ({
			droppedFile: it,
			driveFile: await os.promiseDialog(
				uploadFile(
					it.file,
					selectedFolderId.value,
					it.file.name.replace(/\.[^.]+$/, ''),
					keepOriginalUploading.value,
				),
			),
		}),
		),
	);

	const items = uploadedItems.map(({ droppedFile, driveFile }) => {
		const item = fromDriveFile(driveFile);
		if (directoryToCategory.value) {
			item.category = droppedFile.path
				.replace(/^\//, '')
				.replace(/\/[^/]+$/, '')
				.replace(droppedFile.file.name, '');
		}
		return item;
	});

	await pushToGridItems(items);
}

async function onFileSelectClicked(ev: MouseEvent) {
	const driveFiles = await os.promiseDialog(
		chooseFileFromPc(
			true,
			{
				uploadFolder: selectedFolderId.value,
				keepOriginal: keepOriginalUploading.value,
				// 拡張子は消す
				nameConverter: (file) => file.name.replace(/\.[a-zA-Z0-9]+$/, ''),
			},
		),
	);

	await pushToGridItems(driveFiles.map(fromDriveFile));
}

async function onDriveSelectClicked(ev: MouseEvent) {
	const driveFiles = await os.promiseDialog(chooseFileFromDrive(true));
	await pushToGridItems(driveFiles.map(fromDriveFile));
}

function onGridEvent(event: GridEvent, currentState: GridCurrentState) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'row-context-menu':
			onGridRowContextMenu(event, currentState);
			break;
		case 'cell-context-menu':
			onGridCellContextMenu(event, currentState);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event, currentState);
			break;
		case 'keydown':
			onGridKeyDown(event, currentState);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	registerButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridRowContextMenu(event: GridRowContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択行をコピー',
			icon: 'ti ti-copy',
			action: () => optInGridUtils.rangeCopyToClipboard(gridItems, currentState),
		},
		{
			type: 'button',
			text: '選択行を削除',
			icon: 'ti ti-trash',
			action: () => optInGridUtils.deleteSelectionRange(gridItems, currentState),
		},
	);
}

function onGridCellContextMenu(event: GridCellContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択範囲をコピー',
			icon: 'ti ti-copy',
			action: () => optInGridUtils.rangeCopyToClipboard(gridItems, currentState),
		},
		{
			type: 'button',
			text: '選択行を削除',
			icon: 'ti ti-trash',
			action: () => optInGridUtils.deleteSelectionRange(gridItems, currentState),
		},
	);
}

function onGridCellValueChange(event: GridCellValueChangeEvent, currentState: GridCurrentState) {
	optInGridUtils.applyCellValueFromEvent(gridItems, event);
}

function onGridKeyDown(event: GridKeyDownEvent, currentState: GridCurrentState) {
	optInGridUtils.commonKeyDownHandler(gridItems, event, currentState);
}

async function pushToGridItems(items: GridItem[]) {
	for (const item of items) {
		if (gridItems.value.length < 100) {
			gridItems.value.push(item);
		} else {
			await os.alert({
				type: 'error',
				text: `一度に登録できる絵文字は${MAXIMUM_EMOJI_COUNT}件までです。`,
			});
			break;
		}
	}
}

async function refreshUploadFolders() {
	const result = await misskeyApi('drive/folders', {});
	uploadFolders.value = Array.of<FolderItem>({ name: '-' }, ...result);
}

onMounted(async () => {
	await refreshUploadFolders();
});
</script>

<style module lang="scss">
.uploadBox {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: auto;
	border: 0.5px dotted var(--accentedBg);
	border-radius: var(--border-radius);
	background-color: var(--accentedBg);
	box-sizing: border-box;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}
</style>
