<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="true"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-photo"></i> {{ i18n.ts._imageLabelEditor.title }}</template>

	<div :class="$style.root">
		<div :class="$style.container">
			<div :class="$style.preview">
				<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
				<div :class="$style.previewContainer">
					<div class="_acrylic" :class="$style.previewTitle">{{ i18n.ts.preview }}</div>
					<div v-if="props.image == null" class="_acrylic" :class="$style.previewControls">
						<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '3_2' ? $style.active : null]" @click="sampleImageType = '3_2'"><i class="ti ti-crop-landscape"></i></button>
						<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '2_3' ? $style.active : null]" @click="sampleImageType = '2_3'"><i class="ti ti-crop-portrait"></i></button>
					</div>
				</div>
			</div>
			<div :class="$style.controls">
				<div class="_spacer _gaps">
					<MkRange v-model="frame.frameThickness" :min="0" :max="0.1" :step="0.01" :continuousUpdate="true">
						<template #label>{{ i18n.ts._imageLabelEditor.frameThickness }}</template>
					</MkRange>

					<MkRange v-model="frame.labelThickness" :min="0.1" :max="0.3" :step="0.01" :continuousUpdate="true">
						<template #label>{{ i18n.ts._imageLabelEditor.labelThickness }}</template>
					</MkRange>

					<MkSwitch v-model="frame.centered">
						<template #label>{{ i18n.ts._imageLabelEditor.centered }}</template>
					</MkSwitch>

					<MkInput v-model="frame.title">
						<template #label>{{ i18n.ts._imageLabelEditor.captionMain }}</template>
					</MkInput>

					<MkTextarea v-model="frame.text">
						<template #label>{{ i18n.ts._imageLabelEditor.captionSub }}</template>
					</MkTextarea>

					<MkSwitch v-model="frame.withQrCode">
						<template #label>{{ i18n.ts._imageLabelEditor.withQrCode }}</template>
					</MkSwitch>

					<MkInfo>
						<div>{{ i18n.ts._imageLabelEditor.availableVariables }}:</div>
						<div><code class="_selectableAtomic">{date}</code> - 撮影日時</div>
						<div><code class="_selectableAtomic">{model}</code> - カメラモデル</div>
						<div><code class="_selectableAtomic">{lensModel}</code> - レンズモデル</div>
						<div><code class="_selectableAtomic">{mm}</code> - 焦点距離 (例: 50)</div>
						<div><code class="_selectableAtomic">{f}</code> - 絞り値 (例: 1.8)</div>
						<div><code class="_selectableAtomic">{s}</code> - シャッタースピード (例: 1/125)</div>
						<div><code class="_selectableAtomic">{iso}</code> - ISO感度 (例: 100)</div>
					</MkInfo>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import ExifReader from 'exifreader';
import type { ImageLabelParams } from '@/utility/image-label-renderer.js';
import { ImageLabelRenderer } from '@/utility/image-label-renderer.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import XLayer from '@/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';
import { genId } from '@/utility/id.js';
import { useMkSelect } from '@/composables/use-mkselect.js';

const $i = ensureSignin();

const EXIF_MOCK = {
	DateTimeOriginal: { description: '2025:01:01 12:00:00' },
	Model: { description: 'Example camera' },
	LensModel: { description: 'Example lens 123mm f/1.23' },
	FocalLength: { description: '123mm' },
	ExposureTime: { description: '1/234' },
	FNumber: { description: '1.23' },
	ISOSpeedRatings: { description: '123' },
} satisfies ExifReader.Tags;

const props = defineProps<{
	frame?: ImageLabelParams | null;
	image?: File | null;
}>();

const frame = reactive<ImageLabelParams>(deepClone(props.frame) ?? {
	style: 'frame',
	frameThickness: 0.05,
	labelThickness: 0.2,
	title: 'Untitled by @syuilo',
	text: '{mm}mm   f/{f}   {s}s   ISO{iso}',
	centered: false,
	withQrCode: true,
});

const emit = defineEmits<{
	(ev: 'ok', frame: ImageLabelParams): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	dialog.value?.close();
}

watch(frame, async (newValue, oldValue) => {
	if (renderer != null) {
		renderer.update(frame);
	}
}, { deep: true });

const canvasEl = useTemplateRef('canvasEl');

const sampleImage_3_2 = new Image();
sampleImage_3_2.src = '/client-assets/sample/3-2.jpg';
const sampleImage_3_2_loading = new Promise<void>(resolve => {
	sampleImage_3_2.onload = () => resolve();
});

const sampleImage_2_3 = new Image();
sampleImage_2_3.src = '/client-assets/sample/2-3.jpg';
const sampleImage_2_3_loading = new Promise<void>(resolve => {
	sampleImage_2_3.onload = () => resolve();
});

const sampleImageType = ref(props.image != null ? 'provided' : '3_2');
watch(sampleImageType, async () => {
	if (renderer != null) {
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
});

let renderer: ImageLabelRenderer | null = null;
let imageBitmap: ImageBitmap | null = null;

async function initRenderer() {
	if (canvasEl.value == null) return;

	if (sampleImageType.value === '3_2') {
		renderer = new ImageLabelRenderer({
			canvas: canvasEl.value,
			image: sampleImage_3_2,
			exif: EXIF_MOCK,
			renderAsPreview: true,
		});
	} else if (sampleImageType.value === '2_3') {
		renderer = new ImageLabelRenderer({
			canvas: canvasEl.value,
			image: sampleImage_2_3,
			exif: EXIF_MOCK,
			renderAsPreview: true,
		});
	} else if (props.image != null) {
		imageBitmap = await window.createImageBitmap(props.image);

		renderer = new ImageLabelRenderer({
			canvas: canvasEl.value,
			image: imageBitmap,
			exif: EXIF_MOCK,
			renderAsPreview: true,
		});
	}

	await renderer!.update(frame);

	renderer!.render();
}

onMounted(async () => {
	const closeWaiting = os.waiting();

	await nextTick(); // waitingがレンダリングされるまで待つ

	await sampleImage_3_2_loading;
	await sampleImage_2_3_loading;

	await initRenderer();

	closeWaiting();
});

onUnmounted(() => {
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
	}
	if (imageBitmap != null) {
		imageBitmap.close();
		imageBitmap = null;
	}
});

async function save() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.name,
		default: preset.name,
	});
	if (canceled) return;

	preset.name = name || '';

	dialog.value?.close();
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
	}

	emit('ok', preset);
}
</script>

<style module>
.root {
	container-type: inline-size;
	height: 100%;
}

.container {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.preview {
	position: relative;
	background-color: var(--MI_THEME-bg);
	background-image: linear-gradient(135deg, transparent 30%, var(--MI_THEME-panel) 30%, var(--MI_THEME-panel) 50%, transparent 50%, transparent 80%, var(--MI_THEME-panel) 80%, var(--MI_THEME-panel) 100%);
	background-size: 20px 20px;
	animation: bg 1.2s linear infinite;
}

@keyframes bg {
	0% { background-position: 0 0; }
	100% { background-position: -20px -20px; }
}

.previewContainer {
	display: flex;
	flex-direction: column;
	height: 100%;
	user-select: none;
	-webkit-user-drag: none;
}

.previewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.previewControls {
	position: absolute;
	z-index: 100;
	bottom: 8px;
	right: 8px;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	border-radius: 6px;
}

.previewControlsButton {
	&.active {
		color: var(--MI_THEME-accent);
	}
}

.previewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.previewCanvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 20px;
	box-sizing: border-box;
	object-fit: contain;
}

.controls {
	overflow-y: scroll;
}

@container (max-width: 800px) {
	.container {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
