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
					<div class="_acrylic" :class="$style.watermarkEditorPreviewTitle">{{ i18n.ts.preview }}</div>
				</div>
			</div>
			<div :class="$style.controls" class="_gaps">
				<MkSelect v-model="type" :items="[{ label: i18n.ts._watermarkEditor.text, value: 'text' }, { label: i18n.ts._watermarkEditor.image, value: 'image' }]"></MkSelect>

				<XLayer
					v-for="(layer, i) in preset.layers"
					:key="layer.id"
					v-model:layer="preset.layers[i]"
				></XLayer>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive } from 'vue';
import { v4 as uuid } from 'uuid';
import type { WatermarkPreset } from '@/utility/watermarker.js';
import { i18n } from '@/i18n.js';
import { Watermarker } from '@/utility/watermarker.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSlot from '@/components/form/slot.vue';
import XLayer from '@/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { deepClone } from '@/utility/clone.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const props = defineProps<{
	preset: WatermarkPreset | null;
}>();

const preset = reactive(deepClone(props.preset) ?? {
	id: uuid(),
	name: '',
	layers: [{
		id: uuid(),
		type: 'text',
		text: `(c) @${$i.username}`,
		alignX: 'right',
		alignY: 'bottom',
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

watch(preset, async (newValue, oldValue) => {
	if (renderer != null) {
		renderer.updatePreset(preset);
	}
}, { deep: true });

const canvasEl = useTemplateRef('canvasEl');

const sampleImage = new Image();
sampleImage.src = '/client-assets/sample/3-2.jpg';

let renderer: Watermarker | null = null;

onMounted(() => {
	sampleImage.onload = async () => {
		renderer = new Watermarker({
			canvas: canvasEl.value,
			width: 1500,
			height: 1000,
			preset: preset,
			originalImage: sampleImage,
		});

		await renderer.bakeTextures();

		renderer.render();
	};
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
	cursor: not-allowed;
}

.previewContainer {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.watermarkEditorPreviewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.watermarkEditorPreviewSpinner {
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
	padding: 24px;
	overflow-y: scroll;
}

@container (max-width: 800px) {
	.container {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
