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
	<template #header><i class="ti ti-sparkles"></i> {{ i18n.ts._imageEffector.title }}</template>

	<div :class="$style.root">
		<div :class="$style.container">
			<div :class="$style.preview">
				<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
				<div :class="$style.previewContainer">
					<div class="_acrylic" :class="$style.previewTitle">{{ i18n.ts.preview }}</div>
					<div class="_acrylic" :class="$style.previewControls">
						<button class="_button" :class="[$style.previewControlsButton, !enabled ? $style.active : null]" @click="enabled = false">Before</button>
						<button class="_button" :class="[$style.previewControlsButton, enabled ? $style.active : null]" @click="enabled = true">After</button>
					</div>
				</div>
			</div>
			<div :class="$style.controls">
				<div class="_spacer _gaps">
					<XLayer
						v-for="(layer, i) in layers"
						:key="layer.id"
						v-model:layer="layers[i]"
						@del="onLayerDelete(layer)"
						@swapUp="onLayerSwapUp(layer)"
						@swapDown="onLayerSwapDown(layer)"
					></XLayer>

					<MkButton rounded primary style="margin: 0 auto;" @click="addEffect"><i class="ti ti-plus"></i> {{ i18n.ts._imageEffector.addEffect }}</MkButton>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { i18n } from '@/i18n.js';
import { ImageEffector } from '@/utility/image-effector/ImageEffector.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import XLayer from '@/components/MkImageEffectorDialog.Layer.vue';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';
import { FXS } from '@/utility/image-effector/fxs.js';
import { genId } from '@/utility/id.js';

const props = defineProps<{
	image: File;
}>();

const emit = defineEmits<{
	(ev: 'ok', image: File): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	if (layers.length > 0) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts._imageEffector.discardChangesConfirm,
		});
		if (canceled) return;
	}

	emit('cancel');
	dialog.value?.close();
}

const layers = reactive<ImageEffectorLayer[]>([]);

watch(layers, async () => {
	if (renderer != null) {
		renderer.setLayers(layers);
	}
}, { deep: true });

function addEffect(ev: MouseEvent) {
	os.popupMenu(FXS.map((fx) => ({
		text: fx.name,
		action: () => {
			layers.push({
				id: genId(),
				fxId: fx.id,
				params: Object.fromEntries(Object.entries(fx.params).map(([k, v]) => [k, v.default])),
			});
		},
	})), ev.currentTarget ?? ev.target);
}

function onLayerSwapUp(layer: ImageEffectorLayer) {
	const index = layers.indexOf(layer);
	if (index > 0) {
		layers.splice(index, 1);
		layers.splice(index - 1, 0, layer);
	}
}

function onLayerSwapDown(layer: ImageEffectorLayer) {
	const index = layers.indexOf(layer);
	if (index < layers.length - 1) {
		layers.splice(index, 1);
		layers.splice(index + 1, 0, layer);
	}
}

function onLayerDelete(layer: ImageEffectorLayer) {
	const index = layers.indexOf(layer);
	if (index !== -1) {
		layers.splice(index, 1);
	}
}

const canvasEl = useTemplateRef('canvasEl');

let renderer: ImageEffector<typeof FXS> | null = null;
let imageBitmap: ImageBitmap | null = null;

onMounted(async () => {
	if (canvasEl.value == null) return;

	const closeWaiting = os.waiting();

	await nextTick(); // waitingがレンダリングされるまで待つ

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

	renderer = new ImageEffector({
		canvas: canvasEl.value,
		renderWidth: w,
		renderHeight: h,
		image: imageBitmap,
		fxs: FXS,
	});

	await renderer.setLayers(layers);

	renderer.render();

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
	if (layers.length === 0 || renderer == null || imageBitmap == null || canvasEl.value == null) {
		cancel();
		return;
	}

	const closeWaiting = os.waiting();

	await nextTick(); // waitingがレンダリングされるまで待つ

	renderer.changeResolution(imageBitmap.width, imageBitmap.height); // 本番レンダリングのためオリジナル画質に戻す
	renderer.render(); // toBlobの直前にレンダリングしないと何故か壊れる
	canvasEl.value.toBlob((blob) => {
		emit('ok', new File([blob!], `image-${Date.now()}.png`, { type: 'image/png' }));
		dialog.value?.close();
		closeWaiting();
	}, 'image/png');
}

const enabled = ref(true);
watch(enabled, () => {
	if (renderer != null) {
		if (enabled.value) {
			renderer.setLayers(layers);
		} else {
			renderer.setLayers([]);
		}
		renderer.render();
	}
});
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
