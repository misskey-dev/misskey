<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	@click="cancel()"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		{{ i18n.tsx.uploadNFiles({ n: files.length }) }}
	</template>

	<div>
		<div :class="$style.items">
			<div v-for="ctx in items" :key="ctx.id" :class="$style.item">
				<div :class="$style.itemThumbnail" :style="{ backgroundImage: `url(${ ctx.thumbnail })` }"></div>
				<div class="top">
					<p class="name"><MkLoading :em="true"/>{{ ctx.name }}</p>
					<p class="status">
						<span v-if="ctx.progressValue === null" class="initing">{{ i18n.ts.waiting }}<MkEllipsis/></span>
						<span v-if="ctx.progressValue !== null" class="kb">{{ String(Math.floor(ctx.progressValue / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i> / {{ String(Math.floor(ctx.progressMax / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i></span>
						<span v-if="ctx.progressValue !== null" class="percentage">{{ Math.floor((ctx.progressValue / ctx.progressMax) * 100) }}</span>
					</p>
				</div>
				<progress :value="ctx.progressValue || 0" :max="ctx.progressMax || 0" :class="{ initing: ctx.progressValue === null, waiting: ctx.progressValue !== null && ctx.progressValue === ctx.progressMax }"></progress>
			</div>
		</div>
	</div>

	<template #footer>
		<div>
			<MkButton primary rounded @click="upload()">{{ i18n.ts.upload }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import { getCompressionConfig } from '@/utility/upload/compress-config.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';

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
	uploaded: Misskey.entities.DriveFile | null;
	file: File;
}[]);

const dialog = useTemplateRef('dialog');

function cancel() {
	// TODO: アップロードを中止しますか？
	dialog.value?.close();
}

function upload() {
	for (const item of items.value) {
		if ((file.size > instance.maxFileSize) || (file.size > ($i.policies.maxFileSizeMb * 1024 * 1024))) {
			alert({
				type: 'error',
				title: i18n.ts.failedToUpload,
				text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
			});
			return Promise.reject();
		}

		const reader = new FileReader();
		reader.onload = async (): Promise<void> => {
			const config = !keepOriginal ? await getCompressionConfig(file) : undefined;
			let resizedImage: Blob | undefined;
			if (config) {
				try {
					const resized = await readAndCompressImage(file, config);
					if (resized.size < file.size || file.type === 'image/webp') {
						// The compression may not always reduce the file size
						// (and WebP is not browser safe yet)
						resizedImage = resized;
					}
					if (_DEV_) {
						const saved = ((1 - resized.size / file.size) * 100).toFixed(2);
						console.log(`Image compression: before ${file.size} bytes, after ${resized.size} bytes, saved ${saved}%`);
					}

					ctx.name = file.type !== config.mimeType ? `${ctx.name}.${mimeTypeMap[config.mimeType]}` : ctx.name;
				} catch (err) {
					console.error('Failed to resize image', err);
				}
			}

			const formData = new FormData();
			formData.append('i', $i!.token);
			formData.append('force', 'true');
			formData.append('file', resizedImage ?? file);
			formData.append('name', ctx.name);
			if (_folder) formData.append('folderId', _folder);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = ((ev: ProgressEvent<XMLHttpRequest>) => {
				if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
					// TODO: 消すのではなくて(ネットワーク的なエラーなら)再送できるようにしたい
					uploa______ds.value = uploa______ds.value.filter(x => x.id !== id);

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

				resolve(driveFile);

				uploa______ds.value = uploa______ds.value.filter(x => x.id !== id);
			}) as (ev: ProgressEvent<EventTarget>) => any;

			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable) {
					ctx.progressMax = ev.total;
					ctx.progressValue = ev.loaded;
				}
			};

			xhr.send(formData);
		};
		reader.readAsArrayBuffer(file);
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
.mk-uploader > ol > li > progress {
  display: block;
  background: transparent;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  grid-column: 2/3;
  grid-row: 2/3;
  z-index: 2;
	width: 100%;
	height: 8px;
}
.mk-uploader > ol > li > progress::-webkit-progress-value {
  background: var(--MI_THEME-accent);
}
.mk-uploader > ol > li > progress::-webkit-progress-bar {
  //background: var(--MI_THEME-accentAlpha01);
	background: transparent;
}
</style>
