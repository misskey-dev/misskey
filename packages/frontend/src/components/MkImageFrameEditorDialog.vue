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
	<template #header><i class="ti ti-device-ipad-horizontal"></i> {{ i18n.ts._imageFrameEditor.title }}</template>

	<MkPreviewWithControls>
		<template #preview>
			<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
			<div :class="$style.previewContainer">
				<div class="_acrylic" :class="$style.previewTitle">{{ i18n.ts.preview }}</div>
				<div v-if="props.image == null" class="_acrylic" :class="$style.previewControls">
					<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '3_2' ? $style.active : null]" @click="sampleImageType = '3_2'"><i class="ti ti-crop-landscape"></i></button>
					<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '2_3' ? $style.active : null]" @click="sampleImageType = '2_3'"><i class="ti ti-crop-portrait"></i></button>
					<button class="_button" :class="[$style.previewControlsButton]" @click="choiceImage"><i class="ti ti-upload"></i></button>
				</div>
			</div>
		</template>

		<template #controls>
			<div class="_spacer _gaps">
				<MkRange v-model="params.borderThickness" :min="0" :max="0.2" :step="0.01" :continuousUpdate="true">
					<template #label>{{ i18n.ts._imageFrameEditor.borderThickness }}</template>
				</MkRange>

				<MkInput :modelValue="getHex(params.bgColor)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) params.bgColor = c; }">
					<template #label>{{ i18n.ts._imageFrameEditor.backgroundColor }}</template>
				</MkInput>

				<MkInput :modelValue="getHex(params.fgColor)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) params.fgColor = c; }">
					<template #label>{{ i18n.ts._imageFrameEditor.textColor }}</template>
				</MkInput>

				<MkSelect
					v-model="params.font" :items="[
						{ label: i18n.ts._imageFrameEditor.fontSansSerif, value: 'sans-serif' },
						{ label: i18n.ts._imageFrameEditor.fontSerif, value: 'serif' },
					]"
				>
					<template #label>{{ i18n.ts._imageFrameEditor.font }}</template>
				</MkSelect>

				<MkFolder :defaultOpen="params.labelTop.enabled">
					<template #label>{{ i18n.ts._imageFrameEditor.header }}</template>

					<div class="_gaps">
						<MkSwitch v-model="params.labelTop.enabled">
							<template #label>{{ i18n.ts.show }}</template>
						</MkSwitch>

						<MkRange v-model="params.labelTop.padding" :min="0.01" :max="0.5" :step="0.01" :continuousUpdate="true">
							<template #label>{{ i18n.ts._imageFrameEditor.labelThickness }}</template>
						</MkRange>

						<MkRange v-model="params.labelTop.scale" :min="0.5" :max="2.0" :step="0.01" :continuousUpdate="true">
							<template #label>{{ i18n.ts._imageFrameEditor.labelScale }}</template>
						</MkRange>

						<MkSwitch v-model="params.labelTop.centered">
							<template #label>{{ i18n.ts._imageFrameEditor.centered }}</template>
						</MkSwitch>

						<MkInput v-model="params.labelTop.textBig">
							<template #label>{{ i18n.ts._imageFrameEditor.captionMain }}</template>
						</MkInput>

						<MkTextarea v-model="params.labelTop.textSmall">
							<template #label>{{ i18n.ts._imageFrameEditor.captionSub }}</template>
						</MkTextarea>

						<MkSwitch v-model="params.labelTop.withQrCode">
							<template #label>{{ i18n.ts._imageFrameEditor.withQrCode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkFolder :defaultOpen="params.labelBottom.enabled">
					<template #label>{{ i18n.ts._imageFrameEditor.footer }}</template>

					<div class="_gaps">
						<MkSwitch v-model="params.labelBottom.enabled">
							<template #label>{{ i18n.ts.show }}</template>
						</MkSwitch>

						<MkRange v-model="params.labelBottom.padding" :min="0.01" :max="0.5" :step="0.01" :continuousUpdate="true">
							<template #label>{{ i18n.ts._imageFrameEditor.labelThickness }}</template>
						</MkRange>

						<MkRange v-model="params.labelBottom.scale" :min="0.5" :max="2.0" :step="0.01" :continuousUpdate="true">
							<template #label>{{ i18n.ts._imageFrameEditor.labelScale }}</template>
						</MkRange>

						<MkSwitch v-model="params.labelBottom.centered">
							<template #label>{{ i18n.ts._imageFrameEditor.centered }}</template>
						</MkSwitch>

						<MkInput v-model="params.labelBottom.textBig">
							<template #label>{{ i18n.ts._imageFrameEditor.captionMain }}</template>
						</MkInput>

						<MkTextarea v-model="params.labelBottom.textSmall">
							<template #label>{{ i18n.ts._imageFrameEditor.captionSub }}</template>
						</MkTextarea>

						<MkSwitch v-model="params.labelBottom.withQrCode">
							<template #label>{{ i18n.ts._imageFrameEditor.withQrCode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkInfo>
					<div>{{ i18n.ts._imageFrameEditor.availableVariables }}:</div>
					<div><code class="_selectableAtomic">{filename}</code> - {{ i18n.ts._imageEditing._vars.filename }}</div>
					<div><code class="_selectableAtomic">{filename_without_ext}</code> - {{ i18n.ts._imageEditing._vars.filename_without_ext }}</div>
					<div><code class="_selectableAtomic">{caption}</code> - {{ i18n.ts._imageEditing._vars.caption }}</div>
					<div><code class="_selectableAtomic">{year}</code> - {{ i18n.ts._imageEditing._vars.year }}</div>
					<div><code class="_selectableAtomic">{month}</code> - {{ i18n.ts._imageEditing._vars.month }}</div>
					<div><code class="_selectableAtomic">{day}</code> - {{ i18n.ts._imageEditing._vars.day }}</div>
					<div><code class="_selectableAtomic">{hour}</code> - {{ i18n.ts._imageEditing._vars.hour }}</div>
					<div><code class="_selectableAtomic">{minute}</code> - {{ i18n.ts._imageEditing._vars.minute }}</div>
					<div><code class="_selectableAtomic">{second}</code> - {{ i18n.ts._imageEditing._vars.second }}</div>
					<div><code class="_selectableAtomic">{0month}</code> - {{ i18n.ts._imageEditing._vars.month }} ({{ i18n.ts.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0day}</code> - {{ i18n.ts._imageEditing._vars.day }} ({{ i18n.ts.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0hour}</code> - {{ i18n.ts._imageEditing._vars.hour }} ({{ i18n.ts.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0minute}</code> - {{ i18n.ts._imageEditing._vars.minute }} ({{ i18n.ts.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0second}</code> - {{ i18n.ts._imageEditing._vars.second }} ({{ i18n.ts.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{camera_model}</code> - {{ i18n.ts._imageEditing._vars.camera_model }}</div>
					<div><code class="_selectableAtomic">{camera_lens_model}</code> - {{ i18n.ts._imageEditing._vars.camera_lens_model }}</div>
					<div><code class="_selectableAtomic">{camera_mm}</code> - {{ i18n.ts._imageEditing._vars.camera_mm }}</div>
					<div><code class="_selectableAtomic">{camera_mm_35}</code> - {{ i18n.ts._imageEditing._vars.camera_mm_35 }}</div>
					<div><code class="_selectableAtomic">{camera_f}</code> - {{ i18n.ts._imageEditing._vars.camera_f }}</div>
					<div><code class="_selectableAtomic">{camera_s}</code> - {{ i18n.ts._imageEditing._vars.camera_s }}</div>
					<div><code class="_selectableAtomic">{camera_iso}</code> - {{ i18n.ts._imageEditing._vars.camera_iso }}</div>
					<div><code class="_selectableAtomic">{gps_lat}</code> - {{ i18n.ts._imageEditing._vars.gps_lat }}</div>
					<div><code class="_selectableAtomic">{gps_long}</code> - {{ i18n.ts._imageEditing._vars.gps_long }}</div>
				</MkInfo>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import ExifReader from 'exifreader';
import { throttle } from 'throttle-debounce';
import type { ImageFrameParams, ImageFramePreset } from '@/utility/image-frame-renderer/ImageFrameRenderer.js';
import { ImageFrameRenderer } from '@/utility/image-frame-renderer/ImageFrameRenderer.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkPreviewWithControls from './MkPreviewWithControls.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';
import { genId } from '@/utility/id.js';

const $i = ensureSignin();

const props = defineProps<{
	presetEditMode?: boolean;
	preset?: ImageFramePreset | null;
	params?: ImageFrameParams | null;
	image?: File | null;
	imageCaption?: string | null;
	imageFilename?: string | null;
}>();

const preset = deepClone(props.preset) ?? {
	id: genId(),
	name: '',
};

const params = reactive<ImageFrameParams>(deepClone(props.params) ?? {
	borderThickness: 0.05,
	borderRadius: 0,
	labelTop: {
		enabled: false,
		scale: 1.0,
		padding: 0.2,
		textBig: '',
		textSmall: '',
		centered: false,
		withQrCode: false,
	},
	labelBottom: {
		enabled: true,
		scale: 1.0,
		padding: 0.2,
		textBig: '{year}/{0month}/{0day}',
		textSmall: '{camera_mm}mm   f/{camera_f}   {camera_s}s   ISO{camera_iso}',
		centered: false,
		withQrCode: true,
	},
	bgColor: [1, 1, 1],
	fgColor: [0, 0, 0],
	font: 'sans-serif',
});

const emit = defineEmits<{
	(ev: 'ok', frame: ImageFrameParams): void;
	(ev: 'presetOk', preset: ImageFramePreset): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	if (props.presetEditMode) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts._imageFrameEditor.quitWithoutSaveConfirm,
		});
		if (canceled) return;
	}

	dialog.value?.close();
}

const updateThrottled = throttle(50, () => {
	if (renderer != null) {
		renderer.render(params);
	}
});

watch(params, async (newValue, oldValue) => {
	updateThrottled();
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
	if (sampleImageType.value === 'provided') return;
	if (renderer != null) {
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
});

let imageFile = props.image;

async function choiceImage() {
	const files = await os.chooseFileFromPc({ multiple: false });
	if (files.length === 0) return;
	imageFile = files[0];
	sampleImageType.value = 'provided';
	if (renderer != null) {
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
}

let renderer: ImageFrameRenderer | null = null;
let imageBitmap: ImageBitmap | null = null;

async function initRenderer() {
	if (canvasEl.value == null) return;

	if (sampleImageType.value === '3_2') {
		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: sampleImage_3_2,
			exif: null,
			caption: 'Example caption',
			filename: 'example_file_name.jpg',
			renderAsPreview: true,
		});
	} else if (sampleImageType.value === '2_3') {
		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: sampleImage_2_3,
			exif: null,
			caption: 'Example caption',
			filename: 'example_file_name.jpg',
			renderAsPreview: true,
		});
	} else if (imageFile != null) {
		imageBitmap = await window.createImageBitmap(imageFile);

		const exif = ExifReader.load(await imageFile.arrayBuffer());

		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: imageBitmap,
			exif: exif,
			caption: props.imageCaption ?? null,
			filename: props.imageFilename ?? null,
			renderAsPreview: true,
		});
	}

	await renderer!.render(params);
}

onMounted(async () => {
	const closeWaiting = os.waiting();

	await nextTick(); // waitingがレンダリングされるまで待つ

	await sampleImage_3_2_loading;
	await sampleImage_2_3_loading;

	try {
		await initRenderer();
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			text: i18n.ts._imageFrameEditor.failedToLoadImage,
		});
	}

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
	if (props.presetEditMode) {
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

		emit('presetOk', {
			...preset,
			params: deepClone(params),
		});
	} else {
		dialog.value?.close();
		if (renderer != null) {
			renderer.destroy();
			renderer = null;
		}

		emit('ok', params);
	}
}

function getHex(c: [number, number, number]) {
	return `#${c.map(x => (x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}
</script>

<style module>
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
</style>
