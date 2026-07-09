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
		@pointerdown="onPointerdown"
		@pointermove="onPointermove"
		@pointerup="onPointerup"
		@touchstart="onTouchstart"
		@touchmove="onTouchmove"
	>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { makeDoubleTapDetector } from '@/utility/double-tap.js';

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

function onZoomGesture(ev: { delta: number; centerX: number; centerY: number }) {
	zoomInTo(ev.centerX, ev.centerY, 1 + ev.delta / 200);
}

function onZoomGestureEnd() {
	// TODO: animation
	if (size.value.width < defaultSize.width || size.value.height < defaultSize.height) {
		size.value.width = defaultSize.width;
		size.value.height = defaultSize.height;
		translation.value.x = defaultTranslation.x;
		translation.value.y = defaultTranslation.y;
		isZooming.value = false;
	}
}

// ズーム中、ドラッグされたら画像を移動する
let isDragging = false;
let lastX = 0;
let lastY = 0;

const pointerEventCache = new Map<number, PointerEvent>();
let pointerVec = { x: 0, y: 0 };

let prevTwoTouchPointsDistance = 0;

function onPointermove(ev: PointerEvent) {
	ev.preventDefault();
	ev.stopPropagation();

	if (pointerEventCache.size === 0) {
		return;
	}

	pointerEventCache.set(ev.pointerId, ev);

	if (pointerEventCache.size > 1) { // 2本指での操作
		const a = Array.from(pointerEventCache.values())[0];
		const b = Array.from(pointerEventCache.values())[1];
		const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
		if (prevTwoTouchPointsDistance > 0) {
			const delta = distance - prevTwoTouchPointsDistance;
			onZoomGesture({ delta, centerX: (a.clientX + b.clientX) / 2, centerY: (a.clientY + b.clientY) / 2 });
		}
		prevTwoTouchPointsDistance = distance;
		return;
	}

	prevTwoTouchPointsDistance = 0;

	if (isDragging) {
		const deltaX = ev.clientX - lastX;
		const deltaY = ev.clientY - lastY;

		translation.value.x += deltaX;
		translation.value.y += deltaY;

		pointerVec = { x: deltaX, y: deltaY };
		console.log('pointerVec', pointerVec);

		lastX = ev.clientX;
		lastY = ev.clientY;
	}

	return false;
}

function onPointerdown(ev: PointerEvent) {
	pointerEventCache.set(ev.pointerId, ev);
	imageEl.value.setPointerCapture(ev.pointerId);

	if (!isZooming.value) return;

	isDragging = true;
	lastX = ev.clientX;
	lastY = ev.clientY;
	pointerVec = { x: 0, y: 0 };
}

function onPointerup(ev: PointerEvent) {
	pointerEventCache.delete(ev.pointerId);
	imageEl.value.releasePointerCapture(ev.pointerId);
	prevTwoTouchPointsDistance = 0;
	isDragging = false;
	onZoomGestureEnd();
}

const doubleTapDetector = makeDoubleTapDetector((ev) => {
	ev.preventDefault();
	ev.stopPropagation();
	pointerVec = { x: 0, y: 0 };

	if (isZooming.value) {
		size.value.width = defaultSize.width;
		size.value.height = defaultSize.height;
		translation.value.x = defaultTranslation.x;
		translation.value.y = defaultTranslation.y;
		isZooming.value = false;
	} else {
		zoomInTo(ev.touches[0].clientX, ev.touches[0].clientY, 2);
	}
});

function onTouchstart(ev: TouchEvent) {
	ev.preventDefault();
	ev.stopPropagation();
	doubleTapDetector.onTouchstart(ev);
}

function onTouchmove(ev: TouchEvent) {
	ev.preventDefault();
	ev.stopPropagation();
	doubleTapDetector.onTouchmove(ev);
}

let rafHandle: ReturnType<typeof window['requestAnimationFrame']> | null = null;
let latestInertiaTimeStamp = 0;

function updateInertia(timeStamp: number) {
	rafHandle = window.requestAnimationFrame(updateInertia);
	const timeDelta = timeStamp - latestInertiaTimeStamp;
	latestInertiaTimeStamp = timeStamp;

	if (isDragging) return;
	if (Math.abs(pointerVec.x) < 0.5 && Math.abs(pointerVec.y) < 0.5) return;
	translation.value.x += pointerVec.x;
	translation.value.y += pointerVec.y;
	pointerVec.x *= 0.9 ** (timeDelta / 16.67);
	pointerVec.y *= 0.9 ** (timeDelta / 16.67);
}

onMounted(() => {
	rafHandle = window.requestAnimationFrame(updateInertia);
});

onBeforeUnmount(() => {
	if (rafHandle != null) window.cancelAnimationFrame(rafHandle);
});

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
