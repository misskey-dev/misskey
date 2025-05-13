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

	<div :class="$style.root" class="_gaps_s">
		<div :class="$style.items" class="_gaps_s">
			<div
				v-for="ctx in items"
				:key="ctx.id"
				v-panel
				:class="[$style.item, ctx.waiting ? $style.itemWaiting : null, ctx.uploaded ? $style.itemCompleted : null, ctx.uploadFailed ? $style.itemFailed : null]"
				:style="{ '--p': ctx.progressValue !== null ? `${ctx.progressValue / ctx.progressMax * 100}%` : '0%' }"
			>
				<div :class="$style.itemInner">
					<div>
						<MkButton :iconOnly="true" rounded @click="showMenu($event, ctx)"><i class="ti ti-dots"></i></MkButton>
					</div>
					<div :class="$style.itemThumbnail" :style="{ backgroundImage: `url(${ ctx.thumbnail })` }"></div>
					<div :class="$style.itemBody">
						<div>{{ ctx.name }}</div>
						<div :class="$style.itemInfo">
							<span>{{ bytes(ctx.file.size) }}</span>
							<span v-if="ctx.compressedSize">({{ i18n.tsx._uploader.compressedToX({ x: bytes(ctx.compressedSize) }) }} = {{ i18n.tsx._uploader.savedXPercent({ x: Math.round((1 - ctx.compressedSize / ctx.file.size) * 100) }) }})</span>
						</div>
						<div>
						</div>
					</div>
					<div>
						<MkSystemIcon v-if="ctx.uploading" type="waiting" style="width: 40px;"/>
						<MkSystemIcon v-else-if="ctx.uploaded" type="success" style="width: 40px;"/>
						<MkSystemIcon v-else-if="ctx.uploadFailed" type="error" style="width: 40px;"/>
					</div>
				</div>
			</div>
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
	</div>

	<template #footer>
		<div class="_buttonsCenter">
			<MkButton v-if="isUploading" rounded @click=""><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
			<MkButton v-else-if="!firstUploadAttempted" primary rounded @click="upload()"><i class="ti ti-upload"></i> {{ i18n.ts.upload }}</MkButton>
			<MkButton v-else-if="canRetry" primary rounded @click="upload()"><i class="ti ti-reload"></i> {{ i18n.ts.retry }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import { apiUrl } from '@@/js/config.js';
import isAnimated from 'is-file-animated';
import type { BrowserImageResizerConfigWithConvertedOutput } from '@misskey-dev/browser-image-resizer';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { ensureSignin } from '@/i.js';
import { instance } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';
import bytes from '@/filters/bytes.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import { isWebpSupported } from '@/utility/isWebpSupported.js';
import { uploadFile } from '@/utility/upload.js';

const $i = ensureSignin();

const compressionSupportedTypes = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
] as const;

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

const props = withDefaults(defineProps<{
	files: File[];
	folderId?: string | null;
}>(), {

});

const emit = defineEmits<{
	(ev: 'done', driveFiles: Misskey.entities.DriveFile[]): void;
	(ev: 'closed'): void;
}>();

const items = ref([] as {
	id: string;
	name: string;
	progressMax: number | null;
	progressValue: number | null;
	thumbnail: string;
	waiting: boolean;
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	uploadFailed: boolean;
	compressedSize?: number | null;
	compressedImage?: Blob | null;
	file: File;
}[]);

const dialog = useTemplateRef('dialog');

const firstUploadAttempted = ref(false);
const isUploading = computed(() => items.value.some(item => item.uploading));
const canRetry = computed(() => firstUploadAttempted.value && !isUploading.value && items.value.some(item => item.uploaded == null));

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
		dialog.value?.close();
		return;
	}

	if (items.value.every(item => item.uploaded)) {
		emit('done', items.value.map(item => item.uploaded!));
		dialog.value?.close();
	}
}, { deep: true });

function cancel() {
	// TODO: アップロードを中止しますか？
	dialog.value?.close();
}

function showMenu(ev: MouseEvent, item: typeof items.value[0]) {

}

async function upload() { // エラーハンドリングなどを考慮してシーケンシャルにやる
	firstUploadAttempted.value = true;

	for (const item of items.value.filter(item => item.uploaded == null)) {
		item.waiting = true;
		item.uploadFailed = false;

		const shouldCompress = item.compressedImage == null && compressionLevel.value !== 0 && compressionSettings.value && compressionSupportedTypes.includes(item.file.type) && !(await isAnimated(item.file));

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

		const driveFile = await uploadFile(item.compressedImage ?? item.file, {
			name: item.name,
			folderId: props.folderId,
			onProgress: (progress) => {
				item.waiting = false;
				item.progressMax = progress.total;
				item.progressValue = progress.loaded;
			},
		}).catch(err => {
			item.uploadFailed = true;
			item.progressMax = null;
			item.progressValue = null;
			throw err;
		}).finally(() => {
			item.uploading = false;
		});

		item.uploaded = driveFile;
	}
}

onMounted(() => {
	for (const file of props.files) {
		const id = uuid();
		const filename = file.name ?? 'untitled';
		const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
		items.value.push({
			id,
			name: prefer.s.keepOriginalFilename ? filename : id + extension,
			progressMax: null,
			progressValue: null,
			thumbnail: window.URL.createObjectURL(file),
			waiting: false,
			uploading: false,
			uploaded: null,
			uploadFailed: false,
			file: markRaw(file),
		});
	}
});
</script>

<style lang="scss" module>
.root {
	padding: 12px;
}

.items {
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

@container (max-width: 500px) {
	.itemBody {
		font-size: 90%;
	}
}

.itemInfo {
	opacity: 0.7;
	margin-top: 4px;
	font-size: 90%;
	display: flex;
	gap: 8px;
}
</style>
