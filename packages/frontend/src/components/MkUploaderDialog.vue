<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-upload"></i> {{ i18n.tsx.uploadNFiles({ n: files.length }) }}
	</template>

	<div :class="$style.root">
		<div :class="[$style.overallProgress, canRetry ? $style.overallProgressError : null]" :style="{ '--op': `${overallProgress}%` }"></div>

		<div class="_gaps_s _spacer">
			<div class="_gaps_s">
				<div
					v-for="ctx in items"
					:key="ctx.id"
					v-panel
					:class="[$style.item, ctx.waiting ? $style.itemWaiting : null, ctx.uploaded ? $style.itemCompleted : null, ctx.uploadFailed ? $style.itemFailed : null]"
					:style="{ '--p': ctx.progress != null ? `${ctx.progress.value / ctx.progress.max * 100}%` : '0%' }"
				>
					<div :class="$style.itemInner">
						<div :class="$style.itemActionWrapper">
							<MkButton :iconOnly="true" rounded @click="showMenu($event, ctx)"><i class="ti ti-dots"></i></MkButton>
						</div>
						<div :class="$style.itemThumbnail" :style="{ backgroundImage: `url(${ ctx.thumbnail })` }"></div>
						<div :class="$style.itemBody">
							<div><MkCondensedLine :minScale="2 / 3">{{ ctx.name }}</MkCondensedLine></div>
							<div :class="$style.itemInfo">
								<span>{{ ctx.file.type }}</span>
								<span>{{ bytes(ctx.file.size) }}</span>
								<span v-if="ctx.compressedSize">({{ i18n.tsx._uploader.compressedToX({ x: bytes(ctx.compressedSize) }) }} = {{ i18n.tsx._uploader.savedXPercent({ x: Math.round((1 - ctx.compressedSize / ctx.file.size) * 100) }) }})</span>
							</div>
							<div>
							</div>
						</div>
						<div :class="$style.itemIconWrapper">
							<MkSystemIcon v-if="ctx.uploading" :class="$style.itemIcon" type="waiting"/>
							<MkSystemIcon v-else-if="ctx.uploaded" :class="$style.itemIcon" type="success"/>
							<MkSystemIcon v-else-if="ctx.uploadFailed" :class="$style.itemIcon" type="error"/>
						</div>
					</div>
				</div>
			</div>

			<div v-if="props.multiple">
				<MkButton style="margin: auto;" :iconOnly="true" rounded @click="chooseFile($event)"><i class="ti ti-plus"></i></MkButton>
			</div>

			<MkSelect
				v-if="items.length > 0"
				v-model="compressionLevel"
				:items="[
					{ value: 0, label: i18n.ts.none },
					{ value: 1, label: i18n.ts.low },
					{ value: 2, label: i18n.ts.middle },
					{ value: 3, label: i18n.ts.high },
				]"
			>
				<template #label>{{ i18n.ts.compress }}</template>
			</MkSelect>

			<div>{{ i18n.tsx._uploader.maxFileSizeIsX({ x: $i.policies.maxFileSizeMb + 'MB' }) }}</div>
		</div>
	</div>

	<template #footer>
		<div class="_buttonsCenter">
			<MkButton v-if="isUploading" rounded @click="abortWithConfirm()"><i class="ti ti-x"></i> {{ i18n.ts.abort }}</MkButton>
			<MkButton v-else-if="!firstUploadAttempted" primary rounded @click="upload()"><i class="ti ti-upload"></i> {{ i18n.ts.upload }}</MkButton>

			<MkButton v-if="canRetry" rounded @click="upload()"><i class="ti ti-reload"></i> {{ i18n.ts.retry }}</MkButton>
			<MkButton v-if="canDone" rounded @click="done()"><i class="ti ti-arrow-right"></i> {{ i18n.ts.done }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import isAnimated from 'is-file-animated';
import type { MenuItem } from '@/types/menu.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import MkButton from '@/components/MkButton.vue';
import bytes from '@/filters/bytes.js';
import MkSelect from '@/components/MkSelect.vue';
import { isWebpSupported } from '@/utility/isWebpSupported.js';
import { uploadFile, UploadAbortedError } from '@/utility/drive.js';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const COMPRESSION_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
];

const CROPPING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

const props = withDefaults(defineProps<{
	files: File[];
	folderId?: string | null;
	multiple?: boolean;
}>(), {
	multiple: true,
});

const emit = defineEmits<{
	(ev: 'done', driveFiles: Misskey.entities.DriveFile[]): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const items = ref<{
	id: string;
	name: string;
	progress: { max: number; value: number } | null;
	thumbnail: string;
	waiting: boolean;
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	uploadFailed: boolean;
	aborted: boolean;
	compressedSize?: number | null;
	compressedImage?: Blob | null;
	file: File;
	abort?: (() => void) | null;
}[]>([]);

const dialog = useTemplateRef('dialog');

const firstUploadAttempted = ref(false);
const isUploading = computed(() => items.value.some(item => item.uploading));
const canRetry = computed(() => firstUploadAttempted.value && !items.value.some(item => item.uploading || item.waiting) && items.value.some(item => item.uploaded == null));
const canDone = computed(() => items.value.some(item => item.uploaded != null));
const overallProgress = computed(() => {
	const max = items.value.length;
	if (max === 0) return 0;
	const v = items.value.reduce((acc, item) => {
		if (item.uploaded) return acc + 1;
		if (item.progress) return acc + (item.progress.value / item.progress.max);
		return acc;
	}, 0);
	return Math.round((v / max) * 100);
});

const compressionLevel = ref<0 | 1 | 2 | 3>(2);
const compressionSettings = computed(() => {
	if (compressionLevel.value === 1) {
		return {
			maxWidth: 2000,
			maxHeight: 2000,
		};
	} else if (compressionLevel.value === 2) {
		return {
			maxWidth: 2000 * 0.75, // =1500
			maxHeight: 2000 * 0.75, // =1500
		};
	} else if (compressionLevel.value === 3) {
		return {
			maxWidth: 2000 * 0.75 * 0.75, // =1125
			maxHeight: 2000 * 0.75 * 0.75, // =1125
		};
	} else {
		return null;
	}
});

watch(items, () => {
	if (items.value.length === 0) {
		emit('canceled');
		dialog.value?.close();
		return;
	}

	if (items.value.every(item => item.uploaded)) {
		emit('done', items.value.map(item => item.uploaded!));
		dialog.value?.close();
	}
}, { deep: true });

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts._uploader.abortConfirm,
		okText: i18n.ts.yes,
		cancelText: i18n.ts.no,
	});
	if (canceled) return;

	abortAll();
	emit('canceled');
	dialog.value?.close();
}

async function abortWithConfirm() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts._uploader.abortConfirm,
		okText: i18n.ts.yes,
		cancelText: i18n.ts.no,
	});
	if (canceled) return;

	abortAll();
}

async function done() {
	if (items.value.some(item => item.uploaded == null)) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts._uploader.doneConfirm,
			okText: i18n.ts.yes,
			cancelText: i18n.ts.no,
		});
		if (canceled) return;
	}

	emit('done', items.value.filter(item => item.uploaded != null).map(item => item.uploaded!));
	dialog.value?.close();
}

function showMenu(ev: MouseEvent, item: typeof items.value[0]) {
	const menu: MenuItem[] = [];

	if (CROPPING_SUPPORTED_TYPES.includes(item.file.type) && !item.waiting && !item.uploading && !item.uploaded) {
		menu.push({
			icon: 'ti ti-crop',
			text: i18n.ts.cropImage,
			action: async () => {
				const cropped = await os.cropImageFile(item.file, { aspectRatio: null });
				items.value.splice(items.value.indexOf(item), 1, {
					...item,
					file: markRaw(cropped),
					thumbnail: window.URL.createObjectURL(cropped),
				});
			},
		});
	}

	if (!item.waiting && !item.uploading && !item.uploaded) {
		menu.push({
			icon: 'ti ti-x',
			text: i18n.ts.remove,
			action: () => {
				items.value.splice(items.value.indexOf(item), 1);
			},
		});
	} else if (item.uploading) {
		menu.push({
			icon: 'ti ti-cloud-pause',
			text: i18n.ts.abort,
			danger: true,
			action: () => {
				if (item.abort != null) {
					item.abort();
				}
			}
		});
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

async function upload() { // エラーハンドリングなどを考慮してシーケンシャルにやる
	firstUploadAttempted.value = true;

	items.value = items.value.map(item => ({
		...item,
		aborted: false,
		uploadFailed: false,
		waiting: false,
		uploading: false,
	}));

	for (const item of items.value.filter(item => item.uploaded == null)) {
		// アップロード処理途中で値が変わる場合（途中で全キャンセルされたりなど）もあるので、Array filterではなくここでチェック
		if (item.aborted) {
			continue;
		}

		item.waiting = true;
		item.uploadFailed = false;

		const shouldCompress = item.compressedImage == null && compressionLevel.value !== 0 && compressionSettings.value && COMPRESSION_SUPPORTED_TYPES.includes(item.file.type) && !(await isAnimated(item.file));

		if (shouldCompress) {
			const config = {
				mimeType: isWebpSupported() ? 'image/webp' : 'image/jpeg',
				maxWidth: compressionSettings.value.maxWidth,
				maxHeight: compressionSettings.value.maxHeight,
				quality: isWebpSupported() ? 0.85 : 0.8,
			};

			try {
				const result = await readAndCompressImage(item.file, config);
				if (result.size < item.file.size || item.file.type === 'image/webp') {
					// The compression may not always reduce the file size
					// (and WebP is not browser safe yet)
					item.compressedImage = markRaw(result);
					item.compressedSize = result.size;
					item.name = item.file.type !== config.mimeType ? `${item.name}.${mimeTypeMap[config.mimeType]}` : item.name;
				}
			} catch (err) {
				console.error('Failed to resize image', err);
			}
		}

		item.uploading = true;

		const { filePromise, abort } = uploadFile(item.compressedImage ?? item.file, {
			name: item.name,
			folderId: props.folderId,
			onProgress: (progress) => {
				item.waiting = false;
				if (item.progress == null) {
					item.progress = { max: progress.total, value: progress.loaded };
				} else {
					item.progress.value = progress.loaded;
					item.progress.max = progress.total;
				}
			},
		});

		item.abort = () => {
			item.abort = null;
			abort();
			item.uploading = false;
			item.waiting = false;
			item.uploadFailed = true;
		};

		await filePromise.then((file) => {
			item.uploaded = file;
			item.abort = null;
		}).catch(err => {
			item.uploadFailed = true;
			item.progress = null;
			if (!(err instanceof UploadAbortedError)) {
				throw err;
			}
		}).finally(() => {
			item.uploading = false;
			item.waiting = false;
		});
	}
}

function abortAll() {
	for (const item of items.value) {
		if (item.uploaded != null) {
			continue;
		}

		if (item.abort != null) {
			item.abort();
		}
		item.aborted = true;
		item.uploadFailed = true;
	}
}

async function chooseFile(ev: MouseEvent) {
	const newFiles = await os.chooseFileFromPc({ multiple: true });

	for (const file of newFiles) {
		initializeFile(file);
	}
}

function initializeFile(file: File) {
	const id = uuid();
	const filename = file.name ?? 'untitled';
	const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
	items.value.push({
		id,
		name: prefer.s.keepOriginalFilename ? filename : id + extension,
		progress: null,
		thumbnail: window.URL.createObjectURL(file),
		waiting: false,
		uploading: false,
		aborted: false,
		uploaded: null,
		uploadFailed: false,
		file: markRaw(file),
	});
}

onMounted(() => {
	for (const file of props.files) {
		initializeFile(file);
	}
});
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.overallProgress {
	position: absolute;
	top: 0;
	left: 0;
	width: var(--op);
	height: 4px;
	background: var(--MI_THEME-accent);
	border-radius: 0 999px 999px 0;
	transition: width 0.2s ease;

	&.overallProgressError {
		background: var(--MI_THEME-warn);
	}
}

.item {
	position: relative;
	border-radius: 10px;
	overflow: clip;

	&::before {
		content: '';
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: var(--p);
		height: 100%;
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.5);
		transition: width 0.2s ease, left 0.2s ease;
	}

	&.itemWaiting {
		&::after {
			--c: color(from var(--MI_THEME-accent) srgb r g b / 0.25);

			content: '';
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(-45deg, transparent 25%, var(--c) 25%,var(--c) 50%, transparent 50%, transparent 75%, var(--c) 75%, var(--c));
			background-size: 25px 25px;
			animation: stripe .8s infinite linear;
		}
	}

	&.itemCompleted {
		&::before {
			left: 100%;
			width: var(--p);
		}

		.itemBody {
			color: var(--MI_THEME-accent);
		}
	}

	&.itemFailed {
		.itemBody {
			color: var(--MI_THEME-error);
		}
	}
}

@keyframes stripe {
	0% { background-position-x: 0; }
	100% { background-position-x: -25px; }
}

.itemInner {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.itemThumbnail {
	width: 70px;
	height: 70px;
	background-color: var(--MI_THEME-bg);
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	border-radius: 6px;
}

.itemBody {
	flex: 1;
	min-width: 0;
}

.itemInfo {
	opacity: 0.7;
	margin-top: 4px;
	font-size: 90%;
	display: flex;
	gap: 8px;
}

.itemIcon {
	width: 35px;
}

@container (max-width: 500px) {
	.itemInner {
		flex-direction: column;
		gap: 8px;
	}

	.itemBody {
		font-size: 90%;
		text-align: center;
		width: 100%;
		min-width: 0;
	}

	.itemActionWrapper {
		position: absolute;
		top: 8px;
		left: 8px;
	}

	.itemInfo {
		justify-content: center;
	}

	.itemIconWrapper {
		position: absolute;
		top: 8px;
		right: 8px;
	}
}
</style>
