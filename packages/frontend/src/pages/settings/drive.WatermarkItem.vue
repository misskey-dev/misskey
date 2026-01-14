<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="false" :canPage="false">
	<template #icon><i class="ti ti-pencil"></i></template>
	<template #label>{{ i18n.ts.preset }}: {{ preset.name === '' ? '(' + i18n.ts.noName + ')' : preset.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="edit"><i class="ti ti-pencil"></i> {{ i18n.ts.edit }}</MkButton>
			<MkButton danger iconOnly style="margin-left: auto;" @click="del"><i class="ti ti-trash"></i></MkButton>
		</div>
	</template>

	<div>
		<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import type { WatermarkPreset } from '@/utility/watermark/WatermarkRenderer.js';
import { WatermarkRenderer } from '@/utility/watermark/WatermarkRenderer.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/utility/clone.js';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	preset: WatermarkPreset;
}>();

const emit = defineEmits<{
	(ev: 'updatePreset', preset: WatermarkPreset): void,
	(ev: 'del'): void,
}>();

async function edit() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkWatermarkEditorDialog.vue')), {
		presetEditMode: true,
		preset: deepClone(props.preset),
		layers: deepClone(props.preset.layers),
	}, {
		presetOk: (preset) => {
			emit('updatePreset', preset);
		},
		closed: () => dispose(),
	});
}

function del(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts.delete,
		action: () => {
			emit('del');
		},
	}], ev.currentTarget ?? ev.target);
}

const canvasEl = useTemplateRef('canvasEl');

const sampleImage = new Image();
sampleImage.src = '/client-assets/sample/3-2.jpg';

let renderer: WatermarkRenderer | null = null;

onMounted(() => {
	sampleImage.onload = async () => {
		watch(canvasEl, async () => {
			if (canvasEl.value == null) return;

			renderer = new WatermarkRenderer({
				canvas: canvasEl.value,
				renderWidth: 1500,
				renderHeight: 1000,
				image: sampleImage,
			});

			await renderer.render(props.preset.layers);
		}, { immediate: true });
	};
});

onUnmounted(() => {
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
	}
});

watch(() => props.preset, async () => {
	if (renderer != null) {
		await renderer.render(props.preset.layers);
	}
}, { deep: true });
</script>

<style lang="scss" module>
.previewCanvas {
	display: block;
	width: 100%;
	height: 100%;
	max-height: 200px;
	box-sizing: border-box;
	object-fit: contain;
}
</style>
