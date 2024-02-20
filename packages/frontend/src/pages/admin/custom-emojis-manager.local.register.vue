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

		<XRegisterLogs :logs="requestLogs"/>
	</MkFolder>

	<div
		:class="[$style.uploadBox, [isDragOver ? $style.dragOver : {}]]"
		@dragover.prevent="isDragOver = true"
		@dragleave.prevent="isDragOver = false"
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

	<div v-if="gridItems.length > 0" :class="$style.gridArea">
		<MkGrid
			:data="gridItems"
			:settings="setupGrid()"
			@event="onGridEvent"
		/>
	</div>

	<div v-if="gridItems.length > 0" :class="$style.buttons">
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
import * as Misskey from 'misskey-js';
import { onMounted, ref } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { emptyStrToEmptyArray, emptyStrToNull, RequestLogItem } from '@/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { defaultStore } from '@/store.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { validators } from '@/components/grid/cell-validators.js';
import { chooseFileFromDrive, chooseFileFromPc } from '@/scripts/select-file.js';
import { uploadFile } from '@/scripts/upload.js';
import { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@/components/grid/grid-event.js';
import { DroppedFile, extractDroppedItems, flattenDroppedFiles } from '@/scripts/file-drop.js';
import XRegisterLogs from '@/pages/admin/custom-emojis-manager.logs.vue';
import { GridSetting } from '@/components/grid/grid.js';
import { copyGridDataToClipboard } from '@/components/grid/grid-utils.js';
import { GridRow } from '@/components/grid/row.js';

const MAXIMUM_EMOJI_REGISTER_COUNT = 100;

type FolderItem = {
	id?: string;
	name: string;
};

type GridItem = {
	fileId: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: { id: string, name: string }[];
}

function setupGrid(): GridSetting {
	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);

	function removeRows(rows: GridRow[]) {
		const idxes = [...new Set(rows.map(it => it.index))];
		gridItems.value = gridItems.value.filter((_, i) => !idxes.includes(i));
	}

	return {
		row: {
			showNumber: true,
			selectable: true,
			minimumDefinitionCount: 100,
			styleRules: [
				{
					condition: ({ cells }) => cells.some(it => !it.violation.valid),
					applyStyle: { className: 'violationRow' },
				},
			],
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: '選択行をコピー',
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: '選択行を削除',
						icon: 'ti ti-trash',
						action: () => removeRows(context.rangedRows),
					},
				];
			},
			events: {
				delete(rows) {
					removeRows(rows);
				},
			},
		},
		cols: [
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto', validators: [required] },
			{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140, validators: [required, regex] },
			{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
			{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
			{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
			{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
			{
				bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140,
				valueTransformer: (row) => {
					// バックエンドからからはIDと名前のペア配列で受け取るが、表示にIDがあると煩雑なので名前だけにする
					return gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction
						.map((it) => it.name)
						.join(',');
				},
				customValueEditor: async (row) => {
					// ID直記入は体験的に最悪なのでモーダルを使って入力する
					const current = gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction;
					const result = await os.selectRole({
						initialRoleIds: current.map(it => it.id),
						title: i18n.ts.rolesThatCanBeUsedThisEmojiAsReaction,
						infoMessage: i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription,
						publicOnly: true,
					});
					if (result.canceled) {
						return current;
					}

					const transform = result.result.map(it => ({ id: it.id, name: it.name }));
					gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = transform;

					return transform;
				},
			},
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: '選択範囲をコピー',
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: '選択行を削除',
						icon: 'ti ti-trash',
						action: () => removeRows(context.rangedCells.map(it => it.row)),
					},
				];
			},
		},
	};
}

const uploadFolders = ref<FolderItem[]>([]);
const gridItems = ref<GridItem[]>([]);
const selectedFolderId = ref(defaultStore.state.uploadFolder);
const keepOriginalUploading = ref(defaultStore.state.keepOriginalUploading);
const directoryToCategory = ref<boolean>(false);
const registerButtonDisabled = ref<boolean>(false);
const requestLogs = ref<RequestLogItem[]>([]);
const isDragOver = ref<boolean>(false);

async function onRegistryClicked() {
	const dialogSelection = await os.confirm({
		type: 'info',
		title: '確認',
		text: `リストに表示されている絵文字を新たなカスタム絵文字として登録します。よろしいですか？（負荷を避けるため、一度の操作で登録可能な絵文字は${MAXIMUM_EMOJI_REGISTER_COUNT}件までです）`,
	});

	if (dialogSelection.canceled) {
		return;
	}

	const items = gridItems.value;
	const upload = () => {
		return items.slice(0, MAXIMUM_EMOJI_REGISTER_COUNT)
			.map(item =>
				misskeyApi(
					'admin/emoji/add', {
						name: item.name,
						category: emptyStrToNull(item.category),
						aliases: emptyStrToEmptyArray(item.aliases),
						license: emptyStrToNull(item.license),
						isSensitive: item.isSensitive,
						localOnly: item.localOnly,
						roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.map(it => it.id),
						fileId: item.fileId!,
					})
					.then(() => ({ item, success: true, err: undefined }))
					.catch(err => ({ item, success: false, err })),
			);
	};

	const result = await os.promiseDialog(Promise.all(upload()));
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: 'エラー',
			text: '絵文字の登録に失敗しました。詳細は登録ログをご確認ください。',
		});
	}

	requestLogs.value = result.map(it => ({
		failed: !it.success,
		url: it.item.url,
		name: it.item.name,
		error: it.err ? JSON.stringify(it.err) : undefined,
	}));

	// 登録に成功したものは一覧から除く
	const successItems = result.filter(it => it.success).map(it => it.item);
	gridItems.value = gridItems.value.filter(it => !successItems.includes(it));
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
	isDragOver.value = false;

	const uploadedItems = Array.of<{ droppedFile: DroppedFile, driveFile: Misskey.entities.DriveFile }>();
	try {
		const droppedFiles = await extractDroppedItems(ev).then(it => flattenDroppedFiles(it));
		uploadedItems.push(
			...await os.promiseDialog(
				Promise.all(
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
				),
				() => {
				},
				() => {
				},
			),
		);
	} catch (err) {
		// ダイアログは共通部品側で出ているはずなので何もしない
		return;
	}

	const confirm = await os.confirm({
		type: 'info',
		title: '確認',
		text: `ドラッグ＆ドロップされた${uploadedItems.length}個のファイルをドライブにアップロードします。実行しますか？`,
	});
	if (confirm.canceled) {
		return;
	}

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

	gridItems.value.push(...items);
}

async function onFileSelectClicked() {
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

	gridItems.value.push(...driveFiles.map(fromDriveFile));
}

async function onDriveSelectClicked() {
	const driveFiles = await chooseFileFromDrive(true);
	gridItems.value.push(...driveFiles.map(fromDriveFile));
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	registerButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

function fromDriveFile(it: Misskey.entities.DriveFile): GridItem {
	return {
		fileId: it.id,
		url: it.url,
		name: it.name.replace(/(\.[a-zA-Z0-9]+)+$/, ''),
		host: '',
		category: '',
		aliases: '',
		license: '',
		isSensitive: it.isSensitive,
		localOnly: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: [],
	};
}

async function refreshUploadFolders() {
	const result = await misskeyApi('drive/folders', {});
	uploadFolders.value = Array.of<FolderItem>({ name: '-' }, ...result);
}

onMounted(async () => {
	await refreshUploadFolders();
});
</script>

<style lang="scss">
.violationRow {
	background-color: var(--infoWarnBg);
}
</style>

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

	&.dragOver {
		cursor: copy;
	}
}

.gridArea {
	overflow: scroll;
	padding-top: 8px;
	padding-bottom: 8px;
	resize: vertical;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}
</style>
