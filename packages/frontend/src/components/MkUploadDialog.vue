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
		<MkSwitch v-model="compress">
			<template #label>{{ i18n.ts.compress }}</template>
		</MkSwitch>
		<div :class="$style.items" class="_gaps_s">
			<div v-for="ctx in items" :key="ctx.id" v-panel :class="$style.item" :style="{ '--p': ctx.progressValue !== null ? `${ctx.progressValue / ctx.progressMax * 100}%` : '0%' }">
				<div :class="$style.itemInner">
					<div>
						<MkButton :iconOnly="true" rounded><i class="ti ti-dots"></i></MkButton>
					</div>
					<div :class="$style.itemThumbnail" :style="{ backgroundImage: `url(${ ctx.thumbnail })` }"></div>
					<div :class="$style.itemBody">
						<div>{{ ctx.name }}</div>
						<div style="opacity: 0.7; margin-top: 4px; font-size: 90%;">
							<span>{{ bytes(ctx.file.size) }}</span>
						</div>
						<div>
						</div>
					</div>
					<div>
						<MkLoading v-if="ctx.uploading" :em="true"/>
						<MkSystemIcon v-else-if="ctx.uploaded" type="success" style="width: 40px;"/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<template #footer>
		<div class="_buttonsCenter">
			<MkButton primary rounded @click="upload()"><i class="ti ti-upload"></i> {{ i18n.ts.upload }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import { apiUrl } from '@@/js/config.js';
import { getCompressionConfig } from '@/utility/upload/compress-config.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { ensureSignin } from '@/i.js';
import { instance } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';
import bytes from '@/filters/bytes.js';
import MkSwitch from '@/components/MkSwitch.vue';

const $i = ensureSignin();

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
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	file: File;
}[]);

const dialog = useTemplateRef('dialog');

const compress = ref(true);

function cancel() {
	// TODO: アップロードを中止しますか？
	dialog.value?.close();
}

function upload() {
	for (const item of items.value) {
		if ((item.file.size > instance.maxFileSize) || (item.file.size > ($i.policies.maxFileSizeMb * 1024 * 1024))) {
			alert({
				type: 'error',
				title: i18n.ts.failedToUpload,
				text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
			});
			continue;
		}

		const reader = new FileReader();
		reader.onload = async (): Promise<void> => {
			const config = compress.value ? await getCompressionConfig(item.file) : undefined;
			let resizedImage: Blob | undefined;
			if (config) {
				try {
					const resized = await readAndCompressImage(item.file, config);
					if (resized.size < item.file.size || item.file.type === 'image/webp') {
						// The compression may not always reduce the file size
						// (and WebP is not browser safe yet)
						resizedImage = resized;
					}
					if (_DEV_) {
						const saved = ((1 - resized.size / item.file.size) * 100).toFixed(2);
						console.log(`Image compression: before ${item.file.size} bytes, after ${resized.size} bytes, saved ${saved}%`);
					}

					item.name = item.file.type !== config.mimeType ? `${item.name}.${mimeTypeMap[config.mimeType]}` : item.name;
				} catch (err) {
					console.error('Failed to resize image', err);
				}
			}

			const formData = new FormData();
			formData.append('i', $i.token);
			formData.append('force', 'true');
			formData.append('file', resizedImage ?? item.file);
			formData.append('name', item.name);
			if (props.folderId) formData.append('folderId', props.folderId);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = ((ev: ProgressEvent<XMLHttpRequest>) => {
				item.uploading = false;

				if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
					if (xhr.status === 413) {
						alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
						});
					} else if (ev.target?.response) {
						const res = JSON.parse(ev.target.response);
						if (res.error?.id === 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2') {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: i18n.ts.cannotUploadBecauseInappropriate,
							});
						} else if (res.error?.id === 'd08dbc37-a6a9-463a-8c47-96c32ab5f064') {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: i18n.ts.cannotUploadBecauseNoFreeSpace,
							});
						} else {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: `${res.error?.message}\n${res.error?.code}\n${res.error?.id}`,
							});
						}
					} else {
						alert({
							type: 'error',
							title: 'Failed to upload',
							text: `${JSON.stringify(ev.target?.response)}, ${JSON.stringify(xhr.response)}`,
						});
					}

					reject();
					return;
				}

				const driveFile = JSON.parse(ev.target.response);
				item.uploaded = driveFile;
			}) as (ev: ProgressEvent<EventTarget>) => any;

			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable) {
					item.progressMax = ev.total;
					item.progressValue = ev.loaded;
				}
			};

			xhr.send(formData);
		};
		reader.readAsArrayBuffer(item.file);
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
			uploaded: null,
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
	}
}

.itemInner {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.itemThumbnail {
	width: 70px;
	height: 70px;
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	border-radius: 6px;
}

.itemBody {
	flex: 1;
	min-width: 0;
}
</style>
