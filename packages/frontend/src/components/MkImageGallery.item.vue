<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{ transform: `translate3d(${translation.x}px, ${translation.y}px, 0)` }">
	<img
		ref="imageEl"
		:class="$style.image"
		:src="image.src"
		:width="size.width"
		:height="size.height"
		@wheel="onWheel"
		@touchstart="onTouchstart"
		@pointerdown="onPointerdown"
	>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

type Image = {
	id: string;
	src: string;
	width: number;
	height: number;
	sourceElement?: HTMLElement;
};

const props = withDefaults(defineProps<{
	image: Image;
}>(), {
});

const rootEl = useTemplateRef('rootEl');
const imageEl = useTemplateRef('imageEl');

const padding = 30;

function calcDefaultSize(image: Image) {
	const maxWidth = window.innerWidth - padding * 2;
	const maxHeight = window.innerHeight - padding * 2;

	let width = image.width;
	let height = image.height;

	if (width > maxWidth) {
		height = height * (maxWidth / width);
		width = maxWidth;
	}

	if (height > maxHeight) {
		width = width * (maxHeight / height);
		height = maxHeight;
	}

	return { width, height };
}

function calcDefaultTranslation(image: Image) {
	const defaultSize = calcDefaultSize(image);

	const x = (window.innerWidth - defaultSize.width) / 2;
	const y = (window.innerHeight - defaultSize.height) / 2;

	return { x, y };
}

const defaultSize = calcDefaultSize(props.image);
const defaultTranslation = calcDefaultTranslation(props.image);

const size = ref({ width: defaultSize.width, height: defaultSize.height });
const translation = ref({ x: defaultTranslation.x, y: defaultTranslation.y });

const isZooming = ref(false);

function zoomInTo(x: number, y: number, factor = 1.1) {
	const newWidth = size.value.width * factor;
	const newHeight = size.value.height * factor;

	size.value.width = newWidth;
	size.value.height = newHeight;

	// Center the image on the cursor
	const rect = imageEl.value?.getBoundingClientRect();
	if (!rect) return;

	const offsetX = x - rect.left;
	const offsetY = y - rect.top;

	translation.value.x -= offsetX * (factor - 1);
	translation.value.y -= offsetY * (factor - 1);
	isZooming.value = true;
}

function onWheel(event: WheelEvent) {
	event.preventDefault();

	const delta = event.deltaY;

	const scaleFactor = 1.1;
	const scale = delta > 0 ? 1 / scaleFactor : scaleFactor;

	const newWidth = size.value.width * scale;
	const newHeight = size.value.height * scale;

	if (newWidth < defaultSize.width || newHeight < defaultSize.height) {
		size.value.width = defaultSize.width;
		size.value.height = defaultSize.height;
		translation.value.x = defaultTranslation.x;
		translation.value.y = defaultTranslation.y;
		isZooming.value = false;
		return;
	}

	zoomInTo(event.clientX, event.clientY, scale);
}

let lastTapTime = 0;

function onTouchstart(event: TouchEvent) {
	if (isZooming.value) {
		event.preventDefault();
	}

	if (event.touches.length !== 1) return;

	const touch = event.touches[0];

	let tapTimeout: number | null = null;

	const currentTime = new Date().getTime();
	const tapLength = currentTime - lastTapTime;

	if (tapLength < 300 && tapLength > 0) { // ダブルタップ
		event.preventDefault();

		if (isZooming.value) {
			size.value.width = defaultSize.width;
			size.value.height = defaultSize.height;
			translation.value.x = defaultTranslation.x;
			translation.value.y = defaultTranslation.y;
			isZooming.value = false;
		} else {
			zoomInTo(touch.clientX, touch.clientY, 2);
		}
	}

	lastTapTime = currentTime;

	if (tapTimeout) clearTimeout(tapTimeout);

	tapTimeout = window.setTimeout(() => {
		tapTimeout = null;
	}, 300);
}

// ズーム中、ドラッグされたら画像を移動する
let isDragging = false;
let lastX = 0;
let lastY = 0;

function onPointerdown(event: PointerEvent) {
	if (!isZooming.value) return;

	isDragging = true;
	lastX = event.clientX;
	lastY = event.clientY;

	const onPointerMove = (moveEvent: PointerEvent) => {
		if (!isDragging) return;

		const deltaX = moveEvent.clientX - lastX;
		const deltaY = moveEvent.clientY - lastY;

		translation.value.x += deltaX;
		translation.value.y += deltaY;

		lastX = moveEvent.clientX;
		lastY = moveEvent.clientY;
	};

	const onPointerUp = () => {
		isDragging = false;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
	};

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', onPointerUp);
}

</script>

<style lang="scss" module>
.root {
	//transition: transform 0.2s ease;
	touch-action: none;
}

.image {
	display: block;
	//transition: width 0.2s ease, height 0.2s ease;
}
</style>
