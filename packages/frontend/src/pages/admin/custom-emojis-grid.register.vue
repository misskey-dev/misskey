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
					:data="convertedRegisterLogs"
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
		ここに絵文字の画像ファイルをドラッグ＆ドロップするとドライブにアップロードされます。
	</div>

	<div
		v-if="gridItems.length > 0"
		style="overflow-y: scroll;"
	>
		<MkGrid
			:data="convertedGridItems"
			:columnSettings="columnSettings"
			@operation:cellValidation="onCellValidation"
			@change:cellValue="onChangeCellValue"
		/>
	</div>

	<div
		v-if="gridItems.length > 0"
		:class="$style.buttons"
	>
		<MkButton primary :disabled="registerButtonDisabled" @click="onRegistryClicked">
			{{ i18n.ts.registration }}
		</MkButton>
		<MkButton @click="onClearClicked">{{ i18n.ts.clear }}</MkButton>
	</div>
</div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { GridItem, IGridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { CellValueChangedEvent, ColumnSetting } from '@/components/grid/grid.js';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import { uploadFile } from '@/scripts/upload.js';
import MkSwitch from '@/components/MkSwitch.vue';
import { defaultStore } from '@/store.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { required, ValidateViolation } from '@/components/grid/cell-validators.js';

type FolderItem = {
	id?: string;
	name: string;
};

type UploadResult = {
	key: string,
	item: IGridItem,
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
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: true, width: 50, validators: [required] },
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
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 50 },
	{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 140 },
	{ bindTo: 'error', title: 'log', type: 'text', editable: false, width: 'auto' },
];

const emit = defineEmits<{
	(ev: 'operation:registered'): void;
}>();

const uploadFolders = ref<FolderItem[]>([]);
const gridItems = ref<IGridItem[]>([]);
const selectedFolderId = ref(defaultStore.state.uploadFolder);
const keepOriginalUploading = ref(defaultStore.state.keepOriginalUploading);
const registerButtonDisabled = ref<boolean>(false);
const registerLogs = ref<RegisterLogItem[]>([]);

const convertedGridItems = computed(() => gridItems.value.map(it => it as Record<string, any>));
const convertedRegisterLogs = computed(() => registerLogs.value.map(it => it as Record<string, any>));

async function onRegistryClicked() {
	const dialogSelection = await os.confirm({
		type: 'info',
		title: '確認',
		text: 'リストに表示されている絵文字を新たなカスタム絵文字として登録します。よろしいですか？',
	});

	if (dialogSelection.canceled) {
		return;
	}

	const items = new Map<string, IGridItem>(gridItems.value.map(it => [`${it.fileId}|${it.name}`, it]));
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
	ev.preventDefault();
	ev.stopPropagation();

	const dropFiles = ev.dataTransfer?.files;
	if (!dropFiles) {
		return;
	}

	const uploadingPromises = Array.of<Promise<Misskey.entities.DriveFile>>();
	for (let i = 0; i < dropFiles.length; i++) {
		const file = dropFiles.item(i);
		if (file) {
			const name = file.name.replace(/\.[a-zA-Z0-9]+$/, '');
			uploadingPromises.push(
				uploadFile(
					file,
					selectedFolderId.value,
					name,
					keepOriginalUploading.value,
				),
			);
		}
	}

	const uploadedFiles = await Promise.all(uploadingPromises);
	for (const uploadedFile of uploadedFiles) {
		const item = GridItem.fromDriveFile(uploadedFile);
		gridItems.value.push(item);
	}
}

function onCellValidation(violation: ValidateViolation) {
	console.log(violation);
	registerButtonDisabled.value = !violation.valid;
}

function onChangeCellValue(event: CellValueChangedEvent) {
	console.log(event);
	const item = gridItems.value[event.row.index];
	item[event.column.setting.bindTo] = event.value;
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
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 120px;
	border: 0.5px dotted var(--accentedBg);
	border-radius: var(--border-radius);
	background-color: var(--accentedBg);
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}
</style>
