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
				<div class="_gaps_s">
					<MkFolder v-for="(layer, i) in layers" :key="layer.id" :defaultOpen="false" :canPage="false">
						<template #label>
							<div v-if="layer.type === 'text'">{{ i18n.ts._watermarkEditor.text }}</div>
							<div v-if="layer.type === 'image'">{{ i18n.ts._watermarkEditor.image }}</div>
							<div v-if="layer.type === 'qr'">{{ i18n.ts._watermarkEditor.qr }}</div>
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
							v-model:layer="layers[i]"
						></XLayer>
					</MkFolder>

					<MkButton rounded primary style="margin: 0 auto;" @click="addLayer"><i class="ti ti-plus"></i></MkButton>
				</div>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import type { WatermarkLayers, WatermarkPreset } from '@/utility/watermark/WatermarkRenderer.js';
import { WatermarkRenderer } from '@/utility/watermark/WatermarkRenderer.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkPreviewWithControls from '@/components/MkPreviewWithControls.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import XLayer from '@/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';
import { genId } from '@/utility/id.js';
import { useMkSelect } from '@/composables/use-mkselect.js';
import { prefer } from '@/preferences.js';

const $i = ensureSignin();

function createTextLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'text',
		text: `(c) @${$i.username}`,
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
		noBoundingBoxExpansion: false,
	};
}

function createImageLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'image',
		imageId: null,
		imageUrl: null,
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
		noBoundingBoxExpansion: false,
		cover: false,
	};
}

function createQrLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'qr',
		data: '',
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		opacity: 1,
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
	presetEditMode?: boolean;
	preset?: WatermarkPreset | null;
	layers?: WatermarkLayers | null;
	image?: File | null;
}>();

const preset = deepClone(props.preset) ?? {
	id: genId(),
	name: '',
};

const layers = reactive<WatermarkLayers>(props.layers ?? []);

const emit = defineEmits<{
	(ev: 'ok', layers: WatermarkLayers): void;
	(ev: 'presetOk', preset: WatermarkPreset): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	if (props.presetEditMode) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts._watermarkEditor.quitWithoutSaveConfirm,
		});
		if (canceled) return;
	}

	emit('cancel');
	dialog.value?.close();
}

watch(layers, async (newValue, oldValue) => {
	if (renderer != null) {
		renderer.render(layers);
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
	} else if (imageFile != null) {
		imageBitmap = await window.createImageBitmap(imageFile);

		const MAX_W = 1000;
		const MAX_H = 1000;
		let w = imageBitmap.width;
		let h = imageBitmap.height;

		if (w > MAX_W || h > MAX_H) {
			const scale = Math.min(MAX_W / w, MAX_H / h);
			w = Math.floor(w * scale);
			h = Math.floor(h * scale);
		}

		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: w,
			renderHeight: h,
			image: imageBitmap,
		});
	}

	await renderer!.render(layers);
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
			text: i18n.ts._watermarkEditor.failedToLoadImage,
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
			layers: deepClone(layers),
		});
	} else {
		dialog.value?.close();
		if (renderer != null) {
			renderer.destroy();
			renderer = null;
		}

		emit('ok', layers);
	}
}

function addLayer(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts._watermarkEditor.text,
		action: () => {
			layers.push(createTextLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.image,
		action: () => {
			layers.push(createImageLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.qr,
		action: () => {
			layers.push(createQrLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.stripe,
		action: () => {
			layers.push(createStripeLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.polkadot,
		action: () => {
			layers.push(createPolkadotLayer());
		},
	}, {
		text: i18n.ts._watermarkEditor.checker,
		action: () => {
			layers.push(createCheckerLayer());
		},
	}], ev.currentTarget ?? ev.target);
}

function swapUpLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index > 0) {
		const tmp = layers[index - 1];
		layers[index - 1] = layers[index];
		layers[index] = tmp;
	}
}

function swapDownLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index < layers.length - 1) {
		const tmp = layers[index + 1];
		layers[index + 1] = layers[index];
		layers[index] = tmp;
	}
}

function removeLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index !== -1) {
		layers.splice(index, 1);
	}
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
