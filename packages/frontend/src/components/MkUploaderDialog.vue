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
			<MkTip k="uploader">
				{{ i18n.ts._uploader.tip }}
			</MkTip>

			<div class="_gaps_s">
				<div
					v-for="ctx in items"
					:key="ctx.id"
					v-panel
					:class="[$style.item, ctx.preprocessing ? $style.itemWaiting : null, ctx.uploaded ? $style.itemCompleted : null, ctx.uploadFailed ? $style.itemFailed : null]"
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
								<span v-if="ctx.compressedSize">({{ i18n.tsx._uploader.compressedToX({ x: bytes(ctx.compressedSize) }) }} = {{ i18n.tsx._uploader.savedXPercent({ x: Math.round((1 - ctx.compressedSize / ctx.file.size) * 100) }) }})</span>
								<span v-else>{{ bytes(ctx.file.size) }}</span>
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

			<div>{{ i18n.tsx._uploader.maxFileSizeIsX({ x: $i.policies.maxFileSizeMb + 'MB' }) }}</div>

			<!-- クライアントで検出するMIME typeとサーバーで検出するMIME typeが異なる場合があり、混乱の元になるのでとりあえず隠しとく -->
			<!-- https://github.com/misskey-dev/misskey/issues/16091 -->
			<!--<div>{{ i18n.ts._uploader.allowedTypes }}: {{ $i.policies.uploadableFileTypes.join(', ') }}</div>-->
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

<script lang="ts">
export type UploaderDialogFeatures = {
	effect?: boolean;
	watermark?: boolean;
	crop?: boolean;
};
</script>

<script lang="ts" setup>
import { computed, markRaw, onMounted, onUnmounted, ref, triggerRef, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { genId } from '@/utility/id.js';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import isAnimated from 'is-file-animated';
import type { MenuItem } from '@/types/menu.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import MkButton from '@/components/MkButton.vue';
import bytes from '@/filters/bytes.js';
import { isWebpSupported } from '@/utility/isWebpSupported.js';
import { uploadFile, UploadAbortedError } from '@/utility/drive.js';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';
import { WatermarkRenderer } from '@/utility/watermark.js';

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

const IMAGE_EDITING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const WATERMARK_SUPPORTED_TYPES = IMAGE_EDITING_SUPPORTED_TYPES;

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

const props = withDefaults(defineProps<{
	files: File[];
	folderId?: string | null;
	multiple?: boolean;
	features?: UploaderDialogFeatures;
}>(), {
	multiple: true,
});

const uploaderFeatures = computed<Required<UploaderDialogFeatures>>(() => {
	return {
		effect: props.features?.effect ?? true,
		watermark: props.features?.watermark ?? true,
		crop: props.features?.crop ?? true,
	};
});

const emit = defineEmits<{
	(ev: 'done', driveFiles: Misskey.entities.DriveFile[]): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

type UploaderItem = {
	id: string;
	name: string;
	uploadName?: string;
	progress: { max: number; value: number } | null;
	thumbnail: string;
	preprocessing: boolean;
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	uploadFailed: boolean;
	aborted: boolean;
	compressionLevel: 0 | 1 | 2 | 3;
	compressedSize?: number | null;
	preprocessedFile?: Blob | null;
	file: File;
	watermarkPresetId: string | null;
	abort?: (() => void) | null;
};

const items = ref<UploaderItem[]>([]);

const dialog = useTemplateRef('dialog');

const firstUploadAttempted = ref(false);
const isUploading = computed(() => items.value.some(item => item.uploading));
const canRetry = computed(() => firstUploadAttempted.value && !items.value.some(item => item.uploading || item.preprocessing) && items.value.some(item => item.uploaded == null));
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

function getCompressionSettings(level: 0 | 1 | 2 | 3) {
	if (level === 1) {
		return {
			maxWidth: 2000,
			maxHeight: 2000,
		};
	} else if (level === 2) {
		return {
			maxWidth: 2000 * 0.75, // =1500
			maxHeight: 2000 * 0.75, // =1500
		};
	} else if (level === 3) {
		return {
			maxWidth: 2000 * 0.75 * 0.75, // =1125
			maxHeight: 2000 * 0.75 * 0.75, // =1125
		};
	} else {
		return null;
	}
}

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

function showMenu(ev: MouseEvent, item: UploaderItem) {
	const menu: MenuItem[] = [];

	menu.push({
		icon: 'ti ti-cursor-text',
		text: i18n.ts.rename,
		action: async () => {
			const { result, canceled } = await os.inputText({
				type: 'text',
				title: i18n.ts.rename,
				placeholder: item.name,
				default: item.name,
			});
			if (canceled) return;
			if (result.trim() === '') return;

			item.name = result;
		},
	});

	if (
		uploaderFeatures.value.crop &&
		CROPPING_SUPPORTED_TYPES.includes(item.file.type) &&
		!item.preprocessing &&
		!item.uploading &&
		!item.uploaded
	) {
		menu.push({
			icon: 'ti ti-crop',
			text: i18n.ts.cropImage,
			action: async () => {
				const cropped = await os.cropImageFile(item.file, { aspectRatio: null });
				URL.revokeObjectURL(item.thumbnail);
				const newItem = {
					...item,
					file: markRaw(cropped),
					thumbnail: window.URL.createObjectURL(cropped),
				};
				items.value.splice(items.value.indexOf(item), 1, newItem);
				preprocess(newItem).then(() => {
					triggerRef(items);
				});
			},
		});
	}

	if (
		uploaderFeatures.value.effect &&
		IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) &&
		!item.preprocessing &&
		!item.uploading &&
		!item.uploaded
	) {
		menu.push({
			icon: 'ti ti-sparkles',
			text: i18n.ts._imageEffector.title + ' (BETA)',
			action: async () => {
				const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageEffectorDialog.vue').then(x => x.default), {
					image: item.file,
				}, {
					ok: (file) => {
						URL.revokeObjectURL(item.thumbnail);
						const newItem = {
							...item,
							file: markRaw(file),
							thumbnail: window.URL.createObjectURL(file),
						};
						items.value.splice(items.value.indexOf(item), 1, newItem);
						preprocess(newItem).then(() => {
							triggerRef(items);
						});
					},
					closed: () => dispose(),
				});
			},
		});
	}

	if (
		uploaderFeatures.value.watermark &&
		WATERMARK_SUPPORTED_TYPES.includes(item.file.type) &&
		!item.preprocessing &&
		!item.uploading &&
		!item.uploaded
	) {
		function changeWatermarkPreset(presetId: string | null) {
			item.watermarkPresetId = presetId;
			preprocess(item).then(() => {
				triggerRef(items);
			});
		}

		menu.push({
			icon: 'ti ti-copyright',
			text: i18n.ts.watermark,
			type: 'parent',
			children: [{
				type: 'radioOption',
				text: i18n.ts.none,
				active: computed(() => item.watermarkPresetId == null),
				action: () => changeWatermarkPreset(null),
			}, {
				type: 'divider',
			}, ...prefer.s.watermarkPresets.map(preset => ({
				type: 'radioOption' as const,
				text: preset.name,
				active: computed(() => item.watermarkPresetId === preset.id),
				action: () => changeWatermarkPreset(preset.id),
			})), ...(prefer.s.watermarkPresets.length > 0 ? [{
				type: 'divider' as const,
			}] : []), {
				type: 'button',
				icon: 'ti ti-plus',
				text: i18n.ts.add,
				action: async () => {
					const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkWatermarkEditorDialog.vue').then(x => x.default), {
						image: item.file,
					}, {
						ok: (preset) => {
							prefer.commit('watermarkPresets', [...prefer.s.watermarkPresets, preset]);
							changeWatermarkPreset(preset.id);
						},
						closed: () => dispose(),
					});
				},
			}],
		});
	}

	if (COMPRESSION_SUPPORTED_TYPES.includes(item.file.type) && !item.preprocessing && !item.uploading && !item.uploaded) {
		function changeCompressionLevel(level: 0 | 1 | 2 | 3) {
			item.compressionLevel = level;
			preprocess(item).then(() => {
				triggerRef(items);
			});
		}

		menu.push({
			icon: 'ti ti-leaf',
			text: i18n.ts.compress,
			type: 'parent',
			children: [{
				type: 'radioOption',
				text: i18n.ts.none,
				active: computed(() => item.compressionLevel === 0 || item.compressionLevel == null),
				action: () => changeCompressionLevel(0),
			}, {
				type: 'divider',
			}, {
				type: 'radioOption',
				text: i18n.ts.low,
				active: computed(() => item.compressionLevel === 1),
				action: () => changeCompressionLevel(1),
			}, {
				type: 'radioOption',
				text: i18n.ts.medium,
				active: computed(() => item.compressionLevel === 2),
				action: () => changeCompressionLevel(2),
			}, {
				type: 'radioOption',
				text: i18n.ts.high,
				active: computed(() => item.compressionLevel === 3),
				action: () => changeCompressionLevel(3),
			}],
		});
	}

	if (!item.preprocessing && !item.uploading && !item.uploaded) {
		menu.push({
			type: 'divider',
		}, {
			icon: 'ti ti-x',
			text: i18n.ts.remove,
			action: () => {
				URL.revokeObjectURL(item.thumbnail);
				items.value.splice(items.value.indexOf(item), 1);
			},
		});
	} else if (item.uploading) {
		menu.push({
			type: 'divider',
		}, {
			icon: 'ti ti-cloud-pause',
			text: i18n.ts.abort,
			danger: true,
			action: () => {
				if (item.abort != null) {
					item.abort();
				}
			},
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
		uploading: false,
	}));

	for (const item of items.value.filter(item => item.uploaded == null)) {
		// アップロード処理途中で値が変わる場合（途中で全キャンセルされたりなど）もあるので、Array filterではなくここでチェック
		if (item.aborted) {
			continue;
		}

		item.uploadFailed = false;
		item.uploading = true;

		const { filePromise, abort } = uploadFile(item.preprocessedFile ?? item.file, {
			name: item.uploadName ?? item.name,
			folderId: props.folderId,
			onProgress: (progress) => {
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

async function preprocess(item: (typeof items)['value'][number]): Promise<void> {
	item.preprocessing = true;

	let file: Blob | File = item.file;
	const imageBitmap = await window.createImageBitmap(file);

	const needsWatermark = item.watermarkPresetId != null && WATERMARK_SUPPORTED_TYPES.includes(file.type);
	const preset = prefer.s.watermarkPresets.find(p => p.id === item.watermarkPresetId);
	if (needsWatermark && preset != null) {
		const canvas = window.document.createElement('canvas');
		const renderer = new WatermarkRenderer({
			canvas: canvas,
			renderWidth: imageBitmap.width,
			renderHeight: imageBitmap.height,
			image: imageBitmap,
		});

		await renderer.setLayers(preset.layers);

		renderer.render();

		file = await new Promise<Blob>((resolve) => {
			canvas.toBlob((blob) => {
				if (blob == null) {
					throw new Error('Failed to convert canvas to blob');
				}
				resolve(blob);
				renderer.destroy();
			}, 'image/png');
		});
	}

	const compressionSettings = getCompressionSettings(item.compressionLevel);
	const needsCompress = item.compressionLevel !== 0 && compressionSettings && COMPRESSION_SUPPORTED_TYPES.includes(file.type) && !(await isAnimated(file));

	if (needsCompress) {
		const config = {
			mimeType: isWebpSupported() ? 'image/webp' : 'image/jpeg',
			maxWidth: compressionSettings.maxWidth,
			maxHeight: compressionSettings.maxHeight,
			quality: isWebpSupported() ? 0.85 : 0.8,
		};

		try {
			const result = await readAndCompressImage(file, config);
			if (result.size < file.size || file.type === 'image/webp') {
				// The compression may not always reduce the file size
				// (and WebP is not browser safe yet)
				file = result;
				item.compressedSize = result.size;
				item.uploadName = file.type !== config.mimeType ? `${item.name}.${mimeTypeMap[config.mimeType]}` : item.name;
			}
		} catch (err) {
			console.error('Failed to resize image', err);
		}
	} else {
		item.compressedSize = null;
		item.uploadName = item.name;
	}

	URL.revokeObjectURL(item.thumbnail);
	item.thumbnail = window.URL.createObjectURL(file);
	item.preprocessedFile = markRaw(file);
	item.preprocessing = false;

	imageBitmap.close();
}

function initializeFile(file: File) {
	const id = genId();
	const filename = file.name ?? 'untitled';
	const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
	const item = {
		id,
		name: prefer.s.keepOriginalFilename ? filename : id + extension,
		progress: null,
		thumbnail: window.URL.createObjectURL(file),
		preprocessing: false,
		uploading: false,
		aborted: false,
		uploaded: null,
		uploadFailed: false,
		compressionLevel: prefer.s.defaultImageCompressionLevel,
		watermarkPresetId: uploaderFeatures.value.watermark ? prefer.s.defaultWatermarkPresetId : null,
		file: markRaw(file),
	} satisfies UploaderItem;
	items.value.push(item);
	preprocess(item).then(() => {
		triggerRef(items);
	});
}

onMounted(() => {
	for (const file of props.files) {
		initializeFile(file);
	}
});

onUnmounted(() => {
	for (const item of items.value) {
		URL.revokeObjectURL(item.thumbnail);
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
