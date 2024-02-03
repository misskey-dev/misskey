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
			<li><a @click="onFileSelectClicked">このリンクをクリックしてPCから選択する</a></li>
			<li><a @click="onDriveSelectClicked">このリンクをクリックしてドライブから選択する</a></li>
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
import { getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue';
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
	GridCellValidationEvent,
	GridCellValueChangeEvent,
	GridCurrentState,
	GridEvent,
	GridKeyDownEvent,
	GridRowContextMenuEvent,
} from '@/components/grid/grid-event.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { CellValue } from '@/components/grid/cell.js';
import { ColumnSetting } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';

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

type DroppedItem = DroppedFile | DroppedDirectory;

type DroppedFile = {
	isFile: true;
	path: string;
	file: File;
};

type DroppedDirectory = {
	isFile: false;
	path: string;
	children: DroppedItem[];
}

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
	const dropItems = ev.dataTransfer?.items;
	if (!dropItems || dropItems.length === 0) {
		return;
	}

	const droppedFiles = Array.of<DroppedFile>();
	const apiTestItem = dropItems[0];
	if ('webkitGetAsEntry' in apiTestItem) {
		const droppedItems = await eachDroppedItems(dropItems);
		droppedFiles.push(...flattenDroppedItems(droppedItems).filter(it => it.isFile));
	} else {
		// webkitGetAsEntryに対応していない場合はfilesから取得する（ディレクトリのサポートは出来ない）
		const dropFiles = ev.dataTransfer.files;
		if (dropFiles.length === 0) {
			return;
		}

		for (let i = 0; i < dropFiles.length; i++) {
			const file = dropFiles.item(i);
			if (file) {
				droppedFiles.push({
					isFile: true,
					path: file.name,
					file,
				});
			}
		}
	}

	const uploadedItems = await Promise.all(
		droppedFiles.map(async (it) => ({
			droppedFile: it,
			driveFile: await uploadFile(
				it.file,
				selectedFolderId.value,
				it.file.name.replace(/\.[^.]+$/, ''),
				keepOriginalUploading.value,
			),
		}),
		),
	);

	for (const { droppedFile, driveFile } of uploadedItems) {
		const item = fromDriveFile(driveFile);
		if (directoryToCategory.value) {
			item.category = droppedFile.path
				.replace(/^\//, '')
				.replace(/\/[^/]+$/, '')
				.replace(droppedFile.file.name, '');
		}
		gridItems.value.push(reactive(item));
	}
}

async function onFileSelectClicked(ev: MouseEvent) {
	ev.preventDefault();
	const driveFiles = await chooseFileFromPc(
		true,
		{
			uploadFolder: selectedFolderId.value,
			keepOriginal: keepOriginalUploading.value,
			// 拡張子は消す
			nameConverter: (file) => file.name.replace(/\.[a-zA-Z0-9]+$/, ''),
		},
	);
	gridItems.value.push(...driveFiles.map(fromDriveFile));
}

async function onDriveSelectClicked(ev: MouseEvent) {
	ev.preventDefault();
	const driveFiles = await chooseFileFromDrive(true);
	gridItems.value.push(...driveFiles.map(fromDriveFile));
}

function onRowDeleting(rows: GridRow[]) {
	const deletedIndexes = rows.map(it => it.index);
	gridItems.value = gridItems.value.filter((_, index) => !deletedIndexes.includes(index));
}

function onGridEvent(event: GridEvent, currentState: GridCurrentState) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'row-context-menu':
			onGridRowContextMenu(event, currentState);
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
			text: '行を削除',
			icon: 'ti ti-trash',
			action: () => onRowDeleting(currentState.rangedRows),
		},
	);
}

function onGridCellValueChange(event: GridCellValueChangeEvent, currentState: GridCurrentState) {
	gridItems.value[event.row.index][event.column.setting.bindTo] = event.newValue;
}

function onGridKeyDown(event: GridKeyDownEvent, currentState: GridCurrentState) {
	switch (event.event.code) {
		case 'KeyC': {
			rangeCopyToClipboard(currentState);
			break;
		}
		case 'KeyV': {
			pasteFromClipboard(currentState);
			break;
		}
		case 'Delete': {
			if (currentState.rangedRows.length > 0) {
				onRowDeleting(currentState.rangedRows);
			} else {
				const ranges = currentState.rangedCells;
				for (const cell of ranges) {
					if (cell.column.setting.editable) {
						gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
					}
				}
			}
			break;
		}
	}
}

async function eachDroppedItems(itemList: DataTransferItemList): Promise<DroppedItem[]> {
	async function readEntry(entry: FileSystemEntry): Promise<DroppedItem> {
		if (entry.isFile) {
			return {
				isFile: true,
				path: entry.fullPath,
				file: await readFile(entry as FileSystemFileEntry),
			};
		} else {
			return {
				isFile: false,
				path: entry.fullPath,
				children: await readDirectory(entry as FileSystemDirectoryEntry),
			};
		}
	}

	function readFile(fileSystemFileEntry: FileSystemFileEntry): Promise<File> {
		return new Promise((resolve, reject) => {
			fileSystemFileEntry.file(resolve, reject);
		});
	}

	function readDirectory(fileSystemDirectoryEntry: FileSystemDirectoryEntry): Promise<DroppedItem[]> {
		return new Promise((resolve, reject) => {
			fileSystemDirectoryEntry.createReader().readEntries(
				async (entries) => resolve(await Promise.all(entries.map(readEntry))),
				reject,
			);
		});
	}

	// 扱いにくいので配列に変換
	const items = Array.of<DataTransferItem>();
	for (let i = 0; i < itemList.length; i++) {
		items.push(itemList[i]);
	}

	return Promise.all(
		items
			.map(it => it.webkitGetAsEntry())
			.filter(it => it)
			.map(it => readEntry(it!)),
	);
}

function flattenDroppedItems(items: DroppedItem[]): DroppedFile[] {
	const result = Array.of<DroppedFile>();
	for (const item of items) {
		if (item.isFile) {
			result.push(item);
		} else {
			result.push(...flattenDroppedItems(item.children));
		}
	}
	return result;
}

function rangeCopyToClipboard(currentState: GridCurrentState) {
	const lines = Array.of<string>();
	const bounds = currentState.randedBounds;

	for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
		const items = Array.of<string>();
		for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
			const cell = gridItems.value[row][col];
			items.push(cell.value?.toString() ?? '');
		}
		lines.push(items.join('\t'));
	}

	const text = lines.join('\n');
	copyToClipboard(text);
}

async function pasteFromClipboard(currentState: GridCurrentState) {
	function parseValue(value: string, type: ColumnSetting['type']): CellValue {
		switch (type) {
			case 'number': {
				return Number(value);
			}
			case 'boolean': {
				return value === 'true';
			}
			default: {
				return value;
			}
		}
	}

	const cells = currentState.rangedCells;
	const clipBoardText = await navigator.clipboard.readText();

	const bounds = currentState.randedBounds;
	const lines = clipBoardText.replace(/\r/g, '')
		.split('\n')
		.map(it => it.split('\t'));

	if (lines.length === 1 && lines[0].length === 1) {
		// 単独文字列の場合は選択範囲全体に同じテキストを貼り付ける
		const ranges = currentState.rangedCells;
		for (const cell of ranges) {
			gridItems.value[cell.row.index][cell.column.setting.bindTo] = parseValue(lines[0][0], cell.column.setting.type);
		}
	} else {
		// 表形式文字列の場合は表形式にパースし、選択範囲に合うように貼り付ける
		const offsetRow = bounds.leftTop.row;
		const offsetCol = bounds.leftTop.col;
		for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
			const rowIdx = row - offsetRow;
			if (lines.length <= rowIdx) {
				// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
				break;
			}

			const items = lines[rowIdx];
			for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
				const colIdx = col - offsetCol;
				if (items.length <= colIdx) {
					// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
					break;
				}

				gridItems.value[row][col] = parseValue(items[colIdx], cells[row][col].column.setting.type);
			}
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
