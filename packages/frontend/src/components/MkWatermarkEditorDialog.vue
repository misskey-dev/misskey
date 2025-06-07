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
					<MkSelect v-model="type" :items="[{ label: i18n.ts._watermarkEditor.text, value: 'text' }, { label: i18n.ts._watermarkEditor.image, value: 'image' }, { label: i18n.ts._watermarkEditor.advanced, value: 'advanced' }]">
						<template #label>{{ i18n.ts._watermarkEditor.type }}</template>
					</MkSelect>

					<div v-if="type === 'text' || type === 'image'">
						<XLayer
							v-for="(layer, i) in preset.layers"
							:key="layer.id"
							v-model:layer="preset.layers[i]"
						></XLayer>
					</div>
					<div v-else-if="type === 'advanced'" class="_gaps_s">
						<MkFolder v-for="(layer, i) in preset.layers" :key="layer.id" :defaultOpen="false" :canPage="false">
							<template #label>
								<div v-if="layer.type === 'text'">{{ i18n.ts._watermarkEditor.text }}</div>
								<div v-if="layer.type === 'image'">{{ i18n.ts._watermarkEditor.image }}</div>
								<div v-if="layer.type === 'stripe'">{{ i18n.ts._watermarkEditor.stripe }}</div>
								<div v-if="layer.type === 'polkadot'">{{ i18n.ts._watermarkEditor.polkadot }}</div>
								<div v-if="layer.type === 'checker'">{{ i18n.ts._watermarkEditor.checker }}</div>
							</template>
							<template #footer>
								<div class="_buttons">
									<MkButton iconOnly @click="removeLayer(layer)"><i class="ti ti-trash"></i></MkButton>
									<MkButton iconOnly @click="swapUpLayer(layer)"><i class="ti ti-arrow-up"></i></MkButton>
									<MkButton iconOnly @click="swapDownLayer(layer)"><i class="ti ti-arrow-down"></i></MkButton>
								</div>
							</template>

							<XLayer
								v-model:layer="preset.layers[i]"
							></XLayer>
						</MkFolder>

						<MkButton rounded primary style="margin: 0 auto;" @click="addLayer"><i class="ti ti-plus"></i></MkButton>
					</div>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import type { WatermarkPreset } from '@/utility/watermark.js';
import { WatermarkRenderer } from '@/utility/watermark.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import XLayer from '@/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';
import { genId } from '@/utility/id.js';

const $i = ensureSignin();

function createTextLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'text',
		text: `(c) @${$i.username}`,
		align: { x: 'right', y: 'bottom' },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
	};
}

function createImageLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'image',
		imageId: null,
		imageUrl: null,
		align: { x: 'right', y: 'bottom' },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
		cover: false,
	};
}

function createStripeLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'stripe',
		angle: 0.5,
		frequency: 10,
		threshold: 0.1,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

function createPolkadotLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'polkadot',
		angle: 0.5,
		scale: 3,
		majorRadius: 0.1,
		minorRadius: 0.25,
		majorOpacity: 0.75,
		minorOpacity: 0.5,
		minorDivisions: 4,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

function createCheckerLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'checker',
		angle: 0.5,
		scale: 3,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

const props = defineProps<{
	preset?: WatermarkPreset | null;
	image?: File | null;
}>();

const preset = reactive<WatermarkPreset>(deepClone(props.preset) ?? {
	id: genId(),
	name: '',
	layers: [createTextLayer()],
});

const emit = defineEmits<{
	(ev: 'ok', preset: WatermarkPreset): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts._watermarkEditor.quitWithoutSaveConfirm,
	});
	if (canceled) return;

	emit('cancel');
	dialog.value?.close();
}

const type = ref(preset.layers.length > 1 ? 'advanced' : preset.layers[0].type);
watch(type, () => {
	if (type.value === 'text') {
		preset.layers = [createTextLayer()];
	} else if (type.value === 'image') {
		preset.layers = [createImageLayer()];
	} else if (type.value === 'advanced') {
		// nop
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
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
});

let renderer: WatermarkRenderer | null = null;
let imageBitmap: ImageBitmap | null = null;

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
		imageBitmap = await window.createImageBitmap(props.image);

		const MAX_W = 1000;
		const MAX_H = 1000;
		let w = imageBitmap.width;
		let h = imageBitmap.height;

		if (w > MAX_W || h > MAX_H) {
			const scale = Math.min(MAX_W / w, MAX_H / h);
			w *= scale;
			h *= scale;
		}

		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: w,
			renderHeight: h,
			image: imageBitmap,
		});
	}

	await renderer!.setLayers(preset.layers);

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

function addLayer(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts._watermarkEditor.text,
		action: () => {
			preset.layers.push(createTextLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.image,
		action: () => {
			preset.layers.push(createImageLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.stripe,
		action: () => {
			preset.layers.push(createStripeLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.polkadot,
		action: () => {
			preset.layers.push(createPolkadotLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.checker,
		action: () => {
			preset.layers.push(createCheckerLayer());
		},
	}], ev.currentTarget ?? ev.target);
}

function swapUpLayer(layer: WatermarkPreset['layers'][number]) {
	const index = preset.layers.findIndex(l => l.id === layer.id);
	if (index > 0) {
		const tmp = preset.layers[index - 1];
		preset.layers[index - 1] = preset.layers[index];
		preset.layers[index] = tmp;
	}
}

function swapDownLayer(layer: WatermarkPreset['layers'][number]) {
	const index = preset.layers.findIndex(l => l.id === layer.id);
	if (index < preset.layers.length - 1) {
		const tmp = preset.layers[index + 1];
		preset.layers[index + 1] = preset.layers[index];
		preset.layers[index] = tmp;
	}
}

function removeLayer(layer: WatermarkPreset['layers'][number]) {
	preset.layers = preset.layers.filter(l => l.id !== layer.id);
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
