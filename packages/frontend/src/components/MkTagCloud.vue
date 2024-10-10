<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<canvas :id="idForCanvas" ref="canvasEl" style="display: block;" :width="width" height="300" @contextmenu.prevent="() => {}"></canvas>
	<div :id="idForTags" ref="tagsEl" :class="$style.tags">
		<ul>
			<slot></slot>
		</ul>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch, onBeforeUnmount, ref, shallowRef } from 'vue';
import tinycolor from 'tinycolor2';

const loaded = !!window.TagCanvas;
const SAFE_FOR_HTML_ID = 'abcdefghijklmnopqrstuvwxyz';
const computedStyle = getComputedStyle(document.documentElement);
const idForCanvas = Array.from({ length: 16 }, () => SAFE_FOR_HTML_ID[Math.floor(Math.random() * SAFE_FOR_HTML_ID.length)]).join('');
const idForTags = Array.from({ length: 16 }, () => SAFE_FOR_HTML_ID[Math.floor(Math.random() * SAFE_FOR_HTML_ID.length)]).join('');
const available = ref(false);
const rootEl = shallowRef<HTMLElement | null>(null);
const canvasEl = shallowRef<HTMLCanvasElement | null>(null);
const tagsEl = shallowRef<HTMLElement | null>(null);
const width = ref(300);

watch(available, () => {
	try {
		window.TagCanvas.Start(idForCanvas, idForTags, {
			textColour: '#ffffff',
			outlineColour: tinycolor(computedStyle.getPropertyValue('--MI_THEME-accent')).toHexString(),
			outlineRadius: 10,
			initial: [-0.030, -0.010],
			frontSelect: true,
			imageRadius: 8,
			//dragControl: true,
			dragThreshold: 3,
			wheelZoom: false,
			reverse: true,
			depth: 0.5,
			maxSpeed: 0.2,
			minSpeed: 0.003,
			stretchX: 0.8,
			stretchY: 0.8,
		});
	} catch (err) {}
});

onMounted(() => {
	if (rootEl.value) width.value = rootEl.value.offsetWidth;

	if (loaded) {
		available.value = true;
	} else {
		document.head.appendChild(Object.assign(document.createElement('script'), {
			async: true,
			src: '/client-assets/tagcanvas.min.js',
		})).addEventListener('load', () => available.value = true);
	}
});

onBeforeUnmount(() => {
	if (window.TagCanvas) window.TagCanvas.Delete(idForCanvas);
});

defineExpose({
	update: () => {
		window.TagCanvas.Update(idForCanvas);
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
