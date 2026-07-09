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
		draggable="false"
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

const emit = defineEmits<{
	(ev: 'close'): void;
}>();

const rootEl = useTemplateRef('rootEl');
const imageEl = useTemplateRef('imageEl');

const padding = 30;
const ANIMATION_DURATION = 200;

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

let isAnimating = false;

function beginAnimation(to: { width: number; height: number; x: number; y: number }, duration: number) {
	const easing = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad

	const startTime = performance.now();
	const startSize = { ...size.value };
	const startTranslation = { ...translation.value };
	isAnimating = true;

	function animate() {
		const now = performance.now();
		const elapsed = now - startTime;
		const t = easing(Math.min(elapsed / duration, 1));

		size.value.width = startSize.width + (to.width - startSize.width) * t;
		size.value.height = startSize.height + (to.height - startSize.height) * t;
		translation.value.x = startTranslation.x + (to.x - startTranslation.x) * t;
		translation.value.y = startTranslation.y + (to.y - startTranslation.y) * t;

		if (t < 1) {
			window.requestAnimationFrame(animate);
		} else {
			isAnimating = false;
		}
	}

	window.requestAnimationFrame(animate);
}

const isZooming = ref(false);

function zoomInTo(x: number, y: number, factor = 1.1, withAnimation = false) {
	const newWidth = size.value.width * factor;
	const newHeight = size.value.height * factor;
	isZooming.value = true;

	// Center the image on the cursor
	const rect = imageEl.value?.getBoundingClientRect();
	if (!rect) return;

	const offsetX = x - rect.left;
	const offsetY = y - rect.top;

	if (withAnimation) {
		beginAnimation({
			width: newWidth,
			height: newHeight,
			x: translation.value.x - offsetX * (factor - 1),
			y: translation.value.y - offsetY * (factor - 1),
		}, ANIMATION_DURATION);
	} else {
		size.value.width = newWidth;
		size.value.height = newHeight;
		translation.value.x -= offsetX * (factor - 1);
		translation.value.y -= offsetY * (factor - 1);
	}
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
	if (size.value.width < defaultSize.width || size.value.height < defaultSize.height) {
		isZooming.value = false;
		beginAnimation({
			width: defaultSize.width,
			height: defaultSize.height,
			x: defaultTranslation.x,
			y: defaultTranslation.y,
		}, ANIMATION_DURATION);
	}
}

// ズーム中、ドラッグされたら画像を移動する
let isDragging = false;
let lastX = 0;
let lastY = 0;
let currentPointerId: number | null = null;
let currentPointerStartOffset = { x: 0, y: 0 };
let isVerticalSwiping = false;
let isHorizontalSwiping = false;
let verticalSwipeDelta = 0;

const pointerEventCache = new Map<number, PointerEvent>();
let pointerVec = { x: 0, y: 0 };

function onPointerdown(ev: PointerEvent) {
	pointerEventCache.set(ev.pointerId, ev);
	imageEl.value.setPointerCapture(ev.pointerId);

	isDragging = true;
	lastX = ev.clientX;
	lastY = ev.clientY;
	pointerVec = { x: 0, y: 0 };
	if (currentPointerId == null) {
		currentPointerId = ev.pointerId;
		currentPointerStartOffset = {
			x: ev.clientX,
			y: ev.clientY,
		};
	}
}

let prevTwoTouchPointsDistance = 0;

function onPointermove(ev: PointerEvent) {
	ev.preventDefault();
	ev.stopPropagation();

	if (pointerEventCache.size === 0) {
		return;
	}

	pointerEventCache.set(ev.pointerId, ev);

	if (pointerEventCache.size > 1) { // 2本指での操作
		pointerVec = { x: 0, y: 0 };
		currentPointerId = null;
		isVerticalSwiping = false;
		isHorizontalSwiping = false;
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

	if (currentPointerId === ev.pointerId) {
		const deltaX = ev.clientX - lastX;
		const deltaY = ev.clientY - lastY;

		if (isZooming.value) {
			translation.value.x += deltaX;
			translation.value.y += deltaY;
		} else {
			if (isVerticalSwiping) {
				translation.value.y += deltaY;
				verticalSwipeDelta += deltaY;
			} else if (isHorizontalSwiping) {
				translation.value.x += deltaX;
			} else {
				const isVerticalVector = Math.abs(deltaY) > Math.abs(deltaX);
				if (isVerticalVector) {
					isVerticalSwiping = true;
				} else {
					isHorizontalSwiping = true;
				}
			}
		}

		pointerVec = { x: deltaX, y: deltaY }; // TODO: おそらくこの計算方法だと高リフレッシュレートで実行される環境ほど同じ動かし方でもベクトルは小さくなってしまうと思われるので良い感じにする

		lastX = ev.clientX;
		lastY = ev.clientY;
	}

	return false;
}

function onPointerup(ev: PointerEvent) {
	pointerEventCache.delete(ev.pointerId);
	imageEl.value.releasePointerCapture(ev.pointerId);
	prevTwoTouchPointsDistance = 0;
	isDragging = false;
	if (currentPointerId === ev.pointerId) {
		currentPointerId = null;

		if (isVerticalSwiping) {
			const shouldCloseByUpwardSwipe = verticalSwipeDelta < -200 || pointerVec.y < -3; // 上の方で離された、または上に向かって強めに弾かれた
			const shouldCloseByDownwardSwipe = verticalSwipeDelta > 200 || pointerVec.y > 3; // 下の方で離された、または下に向かって強めに弾かれた
			if (shouldCloseByUpwardSwipe || shouldCloseByDownwardSwipe) {
				emit('close');
				return;
			}

			beginAnimation({
				width: defaultSize.width,
				height: defaultSize.height,
				x: defaultTranslation.x,
				y: defaultTranslation.y,
			}, ANIMATION_DURATION);
		}
	}
	isVerticalSwiping = false;
	isHorizontalSwiping = false;

	onZoomGestureEnd();
}

const doubleTapDetector = makeDoubleTapDetector((ev) => {
	ev.preventDefault();
	ev.stopPropagation();
	pointerVec = { x: 0, y: 0 };

	if (isZooming.value) {
		isZooming.value = false;
		beginAnimation({
			width: defaultSize.width,
			height: defaultSize.height,
			x: defaultTranslation.x,
			y: defaultTranslation.y,
		}, ANIMATION_DURATION);
	} else {
		isZooming.value = true;
		zoomInTo(ev.touches[0].clientX, ev.touches[0].clientY, 2, true);
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
	if (!isZooming.value) return;
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
	-webkit-touch-callout: none;
	user-select: none;
	//transition: width 0.2s ease, height 0.2s ease;
}
</style>
