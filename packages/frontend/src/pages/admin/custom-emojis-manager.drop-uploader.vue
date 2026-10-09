<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkSwitch v-model="editBeforeRegister" :class="$style.switch">
		<template #label>{{ i18n.ts._customEmojisManager._local._dropUpload.editBeforeRegister }}</template>
	</MkSwitch>
	<MkSwitch v-model="useRandomName" :disabled="editBeforeRegister" :class="$style.switch">
		<template #label>{{ i18n.ts._customEmojisManager._local._dropUpload.useRandomNameOnInvalid }}</template>
	</MkSwitch>

	<button
		class="_button"
		:class="[$style.dropArea, { [$style.dragOver]: isDragOver }]"
		@click="onDropAreaClicked"
		@dragover.prevent="onDragOver"
		@dragleave="isDragOver = false"
		@drop.prevent.stop="onDrop"
	>
		<i class="ti ti-upload" :class="$style.dropIcon"></i>
		<span>{{ i18n.ts._customEmojisManager._local._dropUpload.dropHere }}</span>
		<span :class="$style.caption">{{ i18n.ts._customEmojisManager._local._dropUpload.dropHereCaption }}</span>
	</button>
	<input ref="fileInput" type="file" accept="image/*" multiple style="display: none;" @change="onFileInputChanged"/>

	<div v-if="items.length > 0" :class="$style.progress">
		<div :class="$style.progressHeader">
			<span>{{ i18n.tsx._customEmojisManager._local._dropUpload.progress({ done: finishedCount, total: items.length, failed: failedCount }) }}</span>
			<button v-if="finishedCount > 0" class="_textButton" @click="clearFinished">{{ i18n.ts._customEmojisManager._local._dropUpload.clearFinished }}</button>
		</div>
		<div :class="$style.progressBar">
			<div :class="$style.progressBarValue" :style="{ width: `${items.length === 0 ? 0 : finishedCount / items.length * 100}%` }"></div>
		</div>
		<ul :class="$style.list">
			<li v-for="item in items" :key="item.id" :class="$style.item">
				<img :src="item.previewUrl" :class="$style.thumbnail" alt=""/>
				<div :class="$style.itemBody">
					<div :class="$style.itemName">:{{ item.name }}:</div>
					<div v-if="item.status === 'failed'" :class="[$style.itemStatus, $style.failed]">{{ item.error }}</div>
					<div v-else-if="item.renamed" :class="$style.itemStatus">{{ i18n.tsx._customEmojisManager._local._dropUpload.renamedTo({ name: item.name }) }}</div>
					<div v-if="item.status === 'uploading'" :class="$style.itemBar">
						<div :class="$style.itemBarValue" :style="{ width: `${item.progress * 100}%` }"></div>
					</div>
				</div>
				<div :class="$style.itemIcon">
					<i v-if="item.status === 'waiting'" class="ti ti-clock" :title="i18n.ts._customEmojisManager._local._dropUpload.waiting"></i>
					<MkLoading v-else-if="item.status === 'uploading' || item.status === 'registering'" :em="true"/>
					<i v-else-if="item.status === 'done'" class="ti ti-check" :class="$style.success" :title="i18n.ts.done"></i>
					<i v-else class="ti ti-alert-triangle" :class="$style.failed" :title="i18n.ts.failedToUpload"></i>
				</div>
			</li>
		</ul>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { DroppedEmojiFile } from '@/pages/admin/custom-emojis-manager.impl.js';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { uploadFile } from '@/utility/drive.js';
import { extractDroppedItems, flattenDroppedFiles } from '@/utility/file-drop.js';
import { customEmojis } from '@/custom-emojis.js';
import { miLocalStorage } from '@/local-storage.js';
import { instance } from '@/instance.js';
import { $i } from '@/i.js';

// ドロップした順に絵文字が登録されるよう、1 件ずつ処理する
const CONCURRENCY = 1;
const EMOJI_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

type ItemStatus = 'waiting' | 'uploading' | 'registering' | 'done' | 'failed';

type UploadItem = {
	id: number;
	file: File;
	previewUrl: string;
	name: string;
	category: string;
	renamed: boolean;
	status: ItemStatus;
	progress: number;
	error: string | null;
};

const props = defineProps<{
	folderId: string | null;
	directoryToCategory: boolean;
}>();

const emit = defineEmits<{
	(ev: 'editRequested', entries: DroppedEmojiFile[]): void;
}>();

const fileInput = useTemplateRef('fileInput');
const isDragOver = ref(false);
const items = ref<UploadItem[]>([]);
const useRandomName = ref(miLocalStorage.getItem('customEmojisManagerDropUploadUseRandomName') === 'true');
const editBeforeRegister = ref(miLocalStorage.getItem('customEmojisManagerDropUploadEditBeforeRegister') === 'true');

watch(useRandomName, (value) => {
	miLocalStorage.setItem('customEmojisManagerDropUploadUseRandomName', value ? 'true' : 'false');
});
watch(editBeforeRegister, (value) => {
	miLocalStorage.setItem('customEmojisManagerDropUploadEditBeforeRegister', value ? 'true' : 'false');
});

const finishedCount = computed(() => items.value.filter(it => it.status === 'done' || it.status === 'failed').length);
const failedCount = computed(() => items.value.filter(it => it.status === 'failed').length);

// このドロップエリアで登録処理中・登録済みの名前（サーバー側の絵文字一覧への反映前の衝突を防ぐ）
const reservedNames = new Set<string>();
let nextId = 0;
let runningCount = 0;
// 画面を離れたら待機中の項目は開始せず、実行中のアップロード・登録リクエストも中断する
const abortController = new AbortController();
const uploadAborts = new Set<() => void>();

function isNameTaken(name: string): boolean {
	return reservedNames.has(name) || customEmojis.value.some(it => it.name === name);
}

function generateRandomName(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let name: string;
	do {
		name = 'emoji_' + Array.from(crypto.getRandomValues(new Uint8Array(10)), b => chars[b % chars.length]).join('');
	} while (isNameTaken(name));
	return name;
}

function onFilesSelected(entries: DroppedEmojiFile[]) {
	// MIME type が取れないファイルもあるため、判定できたものだけ弾いて残りはサーバー側の検証に任せる
	const images = entries.filter(({ file }) => file.type === '' || file.type.startsWith('image/'));
	if (images.length === 0) return;
	if (editBeforeRegister.value) {
		emit('editRequested', images);
	} else {
		enqueue(images);
	}
}

function enqueue(entries: DroppedEmojiFile[]) {
	for (const { file, category } of entries) {
		items.value.push({
			id: nextId++,
			file,
			previewUrl: URL.createObjectURL(file),
			// 「絵文字の登録」タブでファイルを選択したときと同じ変換をする
			name: file.name.replace(/(\.[a-zA-Z0-9]+)+$/, '').replaceAll('-', '_').replaceAll(' ', '_'),
			category,
			renamed: false,
			status: 'waiting',
			progress: 0,
			error: null,
		});
	}
	pump();
}

function pump() {
	while (runningCount < CONCURRENCY && !abortController.signal.aborted) {
		const item = items.value.find(it => it.status === 'waiting');
		if (item == null) return;
		runningCount++;
		processItem(item).finally(() => {
			runningCount--;
			pump();
		});
	}
}

async function processItem(item: UploadItem) {
	item.status = 'uploading';

	if (!EMOJI_NAME_REGEX.test(item.name) || isNameTaken(item.name)) {
		const reason = !EMOJI_NAME_REGEX.test(item.name)
			? i18n.ts._customEmojisManager._local._dropUpload.invalidName
			: i18n.ts._customEmojisManager._local._dropUpload.duplicateName;
		if (!useRandomName.value) {
			fail(item, reason);
			return;
		}
		item.name = generateRandomName();
		item.renamed = true;
	}
	reservedNames.add(item.name);

	// uploadFile はサイズ超過時にダイアログを出すため、一括処理ではここで弾いて一覧に理由を表示する
	const maxFileSize = Math.min(instance.maxFileSize, ($i?.policies.maxFileSizeMb ?? 0) * 1024 * 1024);
	if (item.file.size > maxFileSize) {
		reservedNames.delete(item.name);
		fail(item, i18n.ts.cannotUploadBecauseExceedsFileSizeLimit);
		return;
	}

	let fileId: string;
	const upload = uploadFile(item.file, {
		folderId: props.folderId,
		onProgress: ({ loaded, total }) => {
			item.progress = total > 0 ? loaded / total : 0;
		},
	});
	uploadAborts.add(upload.abort);
	try {
		fileId = (await upload.filePromise).id;
	} catch {
		reservedNames.delete(item.name);
		fail(item, i18n.ts.failedToUpload);
		return;
	} finally {
		uploadAborts.delete(upload.abort);
	}
	if (abortController.signal.aborted) return;

	item.status = 'registering';
	try {
		await addEmoji(item, fileId);
	} catch (err) {
		if (abortController.signal.aborted) return;
		// 一覧のキャッシュが古く、サーバー側で名前の重複が判明した場合
		const code = (err as { code?: string } | null)?.code;
		if (code === 'DUPLICATE_NAME' && useRandomName.value) {
			item.name = generateRandomName();
			item.renamed = true;
			reservedNames.add(item.name);
			try {
				await addEmoji(item, fileId);
			} catch (retryErr) {
				reservedNames.delete(item.name);
				fail(item, errorToString(retryErr));
				return;
			}
		} else {
			reservedNames.delete(item.name);
			fail(item, code === 'DUPLICATE_NAME' ? i18n.ts._customEmojisManager._local._dropUpload.duplicateName : errorToString(err));
			return;
		}
	}

	item.status = 'done';
}

function addEmoji(item: UploadItem, fileId: string) {
	return misskeyApi('admin/emoji/add', {
		name: item.name,
		category: item.category === '' ? null : item.category,
		fileId,
	}, undefined, abortController.signal);
}

function fail(item: UploadItem, reason: string) {
	item.status = 'failed';
	item.error = reason;
}

function errorToString(err: unknown): string {
	if (err != null && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
		return err.message;
	}
	return String(err);
}

function clearFinished() {
	for (const item of items.value) {
		if (item.status === 'done' || item.status === 'failed') URL.revokeObjectURL(item.previewUrl);
	}
	items.value = items.value.filter(it => it.status !== 'done' && it.status !== 'failed');
}

function onDragOver(ev: DragEvent) {
	if (ev.dataTransfer == null || !ev.dataTransfer.types.includes('Files')) return;
	ev.dataTransfer.dropEffect = 'copy';
	isDragOver.value = true;
}

async function onDrop(ev: DragEvent) {
	isDragOver.value = false;
	const droppedFiles = flattenDroppedFiles(await extractDroppedItems(ev));
	// ディレクトリの読み取り中に画面を離れた場合は、プレビュー用 URL を作らずに終える
	if (abortController.signal.aborted) return;
	onFilesSelected(droppedFiles.map(it => ({
		file: it.file,
		category: props.directoryToCategory ? pathToCategory(it.path) : '',
	})));
}

// "/dir/sub/file.png" → "dir/sub"、ディレクトリなしでドロップされたファイルは空文字
function pathToCategory(path: string): string {
	const relativePath = path.replace(/^\//, '');
	const lastSlash = relativePath.lastIndexOf('/');
	return lastSlash === -1 ? '' : relativePath.slice(0, lastSlash);
}

function onDropAreaClicked() {
	fileInput.value?.click();
}

function onFileInputChanged(ev: Event) {
	const input = ev.target as HTMLInputElement;
	if (input.files) onFilesSelected(Array.from(input.files, file => ({ file, category: '' })));
	input.value = '';
}

onBeforeUnmount(() => {
	abortController.abort();
	for (const abort of uploadAborts) abort();
	for (const item of items.value) URL.revokeObjectURL(item.previewUrl);
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.switch {
	font-size: 0.85em;
}

.dropArea {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 16px 12px;
	border: 2px dashed var(--MI_THEME-divider);
	border-radius: var(--MI-radius-sm);
	text-align: center;
	font-size: 0.9em;
	transition: border-color 0.1s, background-color 0.1s;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}

.dragOver {
	border-color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.dropIcon {
	font-size: 1.6em;
	color: var(--MI_THEME-accent);
}

.caption {
	font-size: 0.8em;
	opacity: 0.7;
}

.progress {
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 0.85em;
}

.progressHeader {
	display: flex;
	justify-content: space-between;
	gap: 8px;
}

.progressBar,
.itemBar {
	height: 4px;
	border-radius: 2px;
	background: var(--MI_THEME-divider);
	overflow: clip;
}

.progressBarValue,
.itemBarValue {
	height: 100%;
	background: var(--MI_THEME-accent);
	transition: width 0.2s;
}

.list {
	margin: 0;
	padding: 0;
	list-style: none;
	max-height: 320px;
	overflow-y: auto;
}

.item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;

	& + & {
		border-top: solid 0.5px var(--MI_THEME-divider);
	}
}

.thumbnail {
	width: 28px;
	height: 28px;
	object-fit: contain;
	flex-shrink: 0;
}

.itemBody {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.itemName {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.itemStatus {
	font-size: 0.85em;
	opacity: 0.8;
	word-break: break-all;
}

.itemIcon {
	flex-shrink: 0;
	width: 1.5em;
	text-align: center;
}

.success {
	color: var(--MI_THEME-success);
}

.failed {
	color: var(--MI_THEME-error);
}
</style>
