<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<canvas ref="canvasEl" style="display: block;" :width="width" height="300" @contextmenu.prevent="() => {}"></canvas>
	<div ref="tagsEl" :class="$style.tags">
		<ul>
			<slot></slot>
		</ul>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, nextTick, ref, shallowRef, useTemplateRef } from 'vue';
import { themeManager } from '@/theme.js';
import tinycolor from 'tinycolor2';
import { TagCanvas } from '@misskey-dev/tagcanvas-es';

const rootEl = useTemplateRef('rootEl');
const canvasEl = useTemplateRef('canvasEl');
const tagsEl = useTemplateRef('tagsEl');
const tagCanvas = shallowRef<TagCanvas | null>(null);
const width = ref(300);

function createTagCanvas() {
	if (tagCanvas.value) {
		tagCanvas.value.destroy();
		tagCanvas.value = null;
	}

	if (tagsEl.value == null || canvasEl.value == null) return;
	if (tagsEl.value.children[0].children.length === 0) return;

	tagCanvas.value = new TagCanvas(canvasEl.value, {
		tagContainer: tagsEl.value,
		textColor: '#ffffff',
		outlineColor: tinycolor(themeManager.currentCompiledTheme!.accent).toHexString(),
		outlineRadius: 10,
		initial: [-0.030, -0.010],
		frontSelect: true,
		imageRadius: 8,
		// dragControl: true,
		dragThreshold: 3,
		wheelZoom: false,
		reverse: true,
		depth: 0.5,
		maxSpeed: 0.2,
		minSpeed: 0.003,
		stretchX: 0.8,
		stretchY: 0.8,
	});
}

onMounted(() => {
	if (rootEl.value) width.value = rootEl.value.offsetWidth;

	nextTick(() => {
		createTagCanvas();
	});
});

onBeforeUnmount(() => {
	if (tagCanvas.value) {
		tagCanvas.value.destroy();
		tagCanvas.value = null;
	}
});

defineExpose({
	update: () => {
		if (tagCanvas.value) {
			tagCanvas.value.update();
		} else {
			createTagCanvas();
		}
	},
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	overflow: clip;
	display: grid;
	place-items: center;
}

.tags {
	position: absolute;
	top: 999px;
	left: 999px;
}
</style>
