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
	<template #header><i class="ti ti-copyright"></i> {{ i18n.ts._watermarkEditor.title }}</template>

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
					<MkSelect v-model="type" :items="[{ label: i18n.ts._watermarkEditor.text, value: 'text' }, { label: i18n.ts._watermarkEditor.image, value: 'image' }]"></MkSelect>

					<XLayer
						v-for="(layer, i) in preset.layers"
						:key="layer.id"
						v-model:layer="preset.layers[i]"
					></XLayer>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive } from 'vue';
import { v4 as uuid } from 'uuid';
import type { WatermarkPreset } from '@/utility/watermark.js';
import { WatermarkRenderer } from '@/utility/watermark.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import XLayer from '@/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const props = defineProps<{
	preset?: WatermarkPreset | null;
	image?: HTMLImageElement | null;
}>();

const preset = reactive(deepClone(props.preset) ?? {
	id: uuid(),
	name: '',
	layers: [{
		id: uuid(),
		type: 'text',
		text: `(c) @${$i.username}`,
		align: { x: 'right', y: 'bottom' },
		scale: 0.3,
		opacity: 0.75,
		repeat: false,
	}],
} satisfies WatermarkPreset);

const emit = defineEmits<{
	(ev: 'ok', preset: WatermarkPreset): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

function cancel() {
	emit('cancel');
	dialog.value?.close();
}

const type = ref(preset.layers[0].type);
watch(type, () => {
	if (type.value === 'text') {
		preset.layers = [{
			id: uuid(),
			type: 'text',
			text: `(c) @${$i.username}`,
			align: { x: 'right', y: 'bottom' },
			scale: 0.3,
			opacity: 0.75,
			repeat: false,
		}];
	} else if (type.value === 'image') {
		preset.layers = [{
			id: uuid(),
			type: 'image',
			imageId: null,
			imageUrl: null,
			align: { x: 'right', y: 'bottom' },
			scale: 0.3,
			opacity: 0.75,
			repeat: false,
		}];
	}
});

watch(preset, async (newValue, oldValue) => {
	if (renderer != null) {
		renderer.setLayers(preset.layers);
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
		renderer.destroy();
		renderer = null;
		initRenderer();
	}
});

let renderer: WatermarkRenderer | null = null;

async function initRenderer() {
	if (canvasEl.value == null) return;

	if (sampleImageType.value === '3_2') {
		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: 1500,
			renderHeight: 1000,
			image: sampleImage_3_2,
		});
	} else if (sampleImageType.value === '2_3') {
		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: 1000,
			renderHeight: 1500,
			image: sampleImage_2_3,
		});
	} else if (props.image != null) {
		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: props.image.width,
			renderHeight: props.image.height,
			image: props.image,
		});
	}

	await renderer!.setLayers(preset.layers);

	renderer!.render();
}

onMounted(async () => {
	await sampleImage_3_2_loading;
	await sampleImage_2_3_loading;

	initRenderer();
});

onUnmounted(() => {
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
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
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 6px, var(--MI_THEME-panel) 6px, var(--MI_THEME-panel) 12px);
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
