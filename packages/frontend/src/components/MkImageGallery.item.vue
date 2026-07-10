<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="$style.root"
>
	<div
		ref="mainEl"
		:class="$style.main"
		@pointerdown.passive="onPointerdown"
		@pointermove.passive="onPointermove"
		@pointerup.passive="onPointerup"
		@pointercancel.passive="cancelPointerGesture"
		@touchstart.passive="onTouchstart"
		@touchmove.passive="onTouchmove"
		@touchcancel.passive="cancelPointerGesture"
		@contextmenu="cancelPointerGesture"
		@wheel="onWheel"
		@click="onCLick"
	>
		<div
			:class="[$style.transformer, { [$style.transition]: enableTransition }]"
			:style="{ translate: `${transform.x}px ${transform.y}px`, scale: transform.scale }"
			@transitionend.self="enableTransition = false"
			@transitioncancel.self="enableTransition = false"
		>
			<img
				v-if="!originalImageLoaded || !thumbnailImageLoaded"
				:class="[$style.image, $style.thumbnail]"
				:src="image.thumbnailUrl"
				:width="image.width"
				:height="image.height"
				:style="{ width: `${imageRenderingSize.width}px`, height: `${imageRenderingSize.height}px` }"
				draggable="false"
				@load="thumbnailImageLoaded = true"
			>
			<img
				v-if="activated"
				ref="imageEl"
				:class="[$style.image, $style.original]"
				:src="image.url"
				:width="image.width"
				:height="image.height"
				:style="{ width: `${imageRenderingSize.width}px`, height: `${imageRenderingSize.height}px` }"
				draggable="false"
				@load="originalImageLoaded = true"
			>
		</div>
	</div>

	<div v-if="activated && !originalImageLoaded" :class="$style.loading">
		<MkLoading/>
	</div>

	<div :class="[$style.footer, { [$style.infoShowing]: infoShowing && !isZooming }]">
		<div :class="$style.footerText">
			{{ image.comment ?? image.filename }}
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { makeDoubleTapDetector } from '@/utility/double-tap.js';
import { calculateSourceTransform } from '@/components/MkImageGallery.utils.js';
import { deviceKind } from '@/utility/device-kind.js';
import { isTouchUsing } from '@/utility/touch.js';

export type Image = {
	id: string;
	url: string;
	thumbnailUrl: string;
	width: number;
	height: number;
	filename?: string;
	comment?: string;
	sourceElement?: HTMLElement;
};

const props = withDefaults(defineProps<{
	image: Image;
	activated: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'close'): void;
	(ev: 'horizontalSwipe', offset: number): void;
	(ev: 'next'): void;
	(ev: 'prev'): void;
	(ev: 'cancelHorizontalSwipe'): void;
}>();

const rootEl = useTemplateRef('rootEl');
const mainEl = useTemplateRef('mainEl');
const imageEl = useTemplateRef('imageEl');

const originalImageLoaded = ref(false);
const thumbnailImageLoaded = ref(false);
const enableTransition = ref(false);
const infoShowing = ref(false);

onMounted(() => {
	rootEl.value.offsetHeight; // reflow
	infoShowing.value = true;
});

const padding = deviceKind === 'smartphone' ? 0 : 30;
const ANIMATION_DURATION = 200;
const headerAreaSize = 0;
const footerAreaSize = 30;

// maxからはみ出す場合は縮小、maxに満たない場合は拡大する(contain)
function calcImageRenderingSize(image: Image) {
	const maxWidth = window.innerWidth - padding * 2;
	const maxHeight = window.innerHeight - headerAreaSize - footerAreaSize - padding * 2;

	const widthRatio = maxWidth / image.width;
	const heightRatio = maxHeight / image.height;
	const ratio = widthRatio < heightRatio ? widthRatio : heightRatio;

	const width = image.width * ratio;
	const height = image.height * ratio;

	return { width, height };
}

const imageRenderingSize = calcImageRenderingSize(props.image);
const imageRenderingRect = {
	left: (window.innerWidth - imageRenderingSize.width) / 2,
	top: headerAreaSize + (window.innerHeight - headerAreaSize - footerAreaSize - imageRenderingSize.height) / 2,
	width: imageRenderingSize.width,
	height: imageRenderingSize.height,
};
const transform = ref({ x: 0, y: 0, scale: 1 });

// 元のimg要素の位置・サイズ(とobject-fitの設定値)を取得して、そこからneutralの位置にアニメーションするためのscaleとtranslationを計算する
function getScaleAndTranslationForSourceElement(): { x: number; y: number; scale: number } {
	const sourceElement = props.image.sourceElement;
	if (sourceElement == null) return { x: 0, y: 0, scale: 1 };

	return calculateSourceTransform({
		fit: window.getComputedStyle(sourceElement).objectFit,
		imageRenderingRect,
		sourceRect: sourceElement.getBoundingClientRect(),
	});
}

if (props.image.sourceElement != null && props.activated) {
	const sourceTransform = getScaleAndTranslationForSourceElement();
	transform.value.scale = sourceTransform.scale;
	transform.value.x = sourceTransform.x;
	transform.value.y = sourceTransform.y;
}

const isZooming = ref(false);

function zoomInTo(x: number, y: number, factor = 1.1, withAnimation = false) {
	const newScale = transform.value.scale * factor;
	isZooming.value = true;

	const rect = mainEl.value.getBoundingClientRect();
	const offsetX = x - rect.left;
	const offsetY = y - rect.top;

	const newTranslationX = offsetX - (offsetX - transform.value.x) * factor;
	const newTranslationY = offsetY - (offsetY - transform.value.y) * factor;

	if (withAnimation) {
		enableTransition.value = true;
	}

	transform.value.x = newTranslationX;
	transform.value.y = newTranslationY;
	transform.value.scale = newScale;
}

function resetToNeutral() {
	isZooming.value = false;

	enableTransition.value = true;
	rootEl.value.offsetHeight; // reflow
	transform.value.scale = 1;
	transform.value.x = 0;
	transform.value.y = 0;
}

function closeThis() {
	emit('close');

	infoShowing.value = false;

	const sourceTransform = getScaleAndTranslationForSourceElement();

	enableTransition.value = true;
	rootEl.value.offsetHeight; // reflow
	transform.value.x = sourceTransform.x;
	transform.value.y = sourceTransform.y;
	transform.value.scale = sourceTransform.scale;
}

function onWheel(event: WheelEvent) {
	event.preventDefault();

	const delta = event.deltaY;

	const scaleFactor = 1.1;
	const scale = delta > 0 ? 1 / scaleFactor : scaleFactor;

	const newScale = transform.value.scale * scale;

	if (newScale < 1) {
		transform.value.scale = 1;
		transform.value.x = 0;
		transform.value.y = 0;
		isZooming.value = false;
		return;
	}

	zoomInTo(event.clientX, event.clientY, scale);
}

function onZoomGesture(ev: { delta: number; centerX: number; centerY: number }) {
	zoomInTo(ev.centerX, ev.centerY, 1 + ev.delta / 200);
}

function onZoomGestureEnd() {
	if (transform.value.scale < 1) {
		isZooming.value = false;
		resetToNeutral();
	}
}

// ズーム中、ドラッグされたら画像を移動する
let isDragging = false;
let isClick = false;
let lastX = 0;
let lastY = 0;
let currentPointerId: number | null = null;
let currentPointerStartOffset = { x: 0, y: 0 };
let isVerticalSwiping = false;
let isHorizontalSwiping = false;
let verticalSwipeDelta = 0;
let horizontalSwipeDelta = 0;

const pointerEventCache = new Map<number, PointerEvent>();
let pointerVec = { x: 0, y: 0 };

function onPointerdown(ev: PointerEvent) {
	pointerEventCache.set(ev.pointerId, ev);
	mainEl.value.setPointerCapture(ev.pointerId);

	isDragging = true;
	isClick = true;
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
let lastMoveTimeStamp = 0;

function onPointermove(ev: PointerEvent) {
	const currentTime = performance.now();
	const dt = currentTime - lastMoveTimeStamp;
	lastMoveTimeStamp = currentTime;

	if (pointerEventCache.size === 0) {
		return;
	}

	pointerEventCache.set(ev.pointerId, ev);

	if (pointerEventCache.size > 1) { // 2本指での操作
		pointerVec = { x: 0, y: 0 };
		currentPointerId = null;
		isVerticalSwiping = false;
		isHorizontalSwiping = false;
		isClick = false;
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

		if (Math.abs(ev.clientX - currentPointerStartOffset.x) > 5 || Math.abs(ev.clientY - currentPointerStartOffset.y) > 5) {
			isClick = false;
		}

		if (isZooming.value) {
			transform.value.x += deltaX;
			transform.value.y += deltaY;
		} else {
			if (isVerticalSwiping) {
				transform.value.y += deltaY;
				verticalSwipeDelta += deltaY;
			} else if (isHorizontalSwiping) {
				horizontalSwipeDelta = ev.clientX - currentPointerStartOffset.x;
				emit('horizontalSwipe', horizontalSwipeDelta);
			} else {
				const isVerticalVector = Math.abs(deltaY) > Math.abs(deltaX);
				if (isVerticalVector) {
					isVerticalSwiping = true;
				} else {
					isHorizontalSwiping = true;
				}
			}
		}

		if (dt > 0) {
			pointerVec = { x: deltaX / dt, y: deltaY / dt };
		}

		lastX = ev.clientX;
		lastY = ev.clientY;
	}

	return false;
}

function onPointerup(ev: PointerEvent) {
	pointerEventCache.delete(ev.pointerId);
	mainEl.value.releasePointerCapture(ev.pointerId);
	prevTwoTouchPointsDistance = 0;
	isDragging = false;
	if (currentPointerId === ev.pointerId) {
		currentPointerId = null;

		if (isVerticalSwiping) {
			const shouldCloseByUpwardSwipe = verticalSwipeDelta < -200 || (verticalSwipeDelta < 0 && pointerVec.y < -3); // 上の方で離された、または上に向かって強めに弾かれた
			const shouldCloseByDownwardSwipe = verticalSwipeDelta > 200 || (verticalSwipeDelta > 0 && pointerVec.y > 3); // 下の方で離された、または下に向かって強めに弾かれた
			if (shouldCloseByUpwardSwipe || shouldCloseByDownwardSwipe) {
				closeThis();
				return;
			}

			resetToNeutral();
		} else if (isHorizontalSwiping) {
			const shouldNext = horizontalSwipeDelta < -150 || (horizontalSwipeDelta < 0 && pointerVec.x < -1); // 左の方で離された、または左に向かって強めに弾かれた
			const shouldPrev = horizontalSwipeDelta > 150 || (horizontalSwipeDelta > 0 && pointerVec.x > 1); // 右の方で離された、または右に向かって強めに弾かれた
			if (shouldNext) {
				emit('next');
			} else if (shouldPrev) {
				emit('prev');
			} else {
				emit('cancelHorizontalSwipe');
			}
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
		resetToNeutral();
	} else {
		isZooming.value = true;
		zoomInTo(ev.touches[0].clientX, ev.touches[0].clientY, 2, true);
	}
});

function cancelPointerGesture() {
	const wasVerticalSwiping = isVerticalSwiping;
	const wasHorizontalSwiping = isHorizontalSwiping;

	pointerEventCache.clear();
	prevTwoTouchPointsDistance = 0;
	currentPointerId = null;
	isDragging = false;
	isClick = false;
	pointerVec = { x: 0, y: 0 };
	verticalSwipeDelta = 0;
	horizontalSwipeDelta = 0;
	isVerticalSwiping = false;
	isHorizontalSwiping = false;
	doubleTapDetector.reset();

	if (wasVerticalSwiping) resetToNeutral();
	if (wasHorizontalSwiping) emit('cancelHorizontalSwipe');
}

function onTouchstart(ev: TouchEvent) {
	ev.preventDefault();
	ev.stopPropagation();
	doubleTapDetector.onTouchstart(ev);
}

function onTouchmove(ev: TouchEvent) {
	doubleTapDetector.onTouchmove(ev);
}

let rafHandle: ReturnType<typeof window['requestAnimationFrame']> | null = null;
let latestInertiaTimeStamp = 0;

//#region inertia
const inertiaFactor = 0.9;

function updateInertia(timeStamp: number) {
	rafHandle = window.requestAnimationFrame(updateInertia);
	const timeDelta = timeStamp - latestInertiaTimeStamp;
	latestInertiaTimeStamp = timeStamp;

	if (isDragging) return;
	if (!isZooming.value) return;
	if (Math.abs(pointerVec.x) < 0.01 && Math.abs(pointerVec.y) < 0.01) return;
	transform.value.x += pointerVec.x * timeDelta;
	transform.value.y += pointerVec.y * timeDelta;
	pointerVec.x *= inertiaFactor ** (timeDelta / 16.67);
	pointerVec.y *= inertiaFactor ** (timeDelta / 16.67);
}

onMounted(() => {
	rafHandle = window.requestAnimationFrame(updateInertia);
});

onBeforeUnmount(() => {
	if (rafHandle != null) window.cancelAnimationFrame(rafHandle);
});
//#endregion

watch(thumbnailImageLoaded, () => {
	if (props.image.sourceElement != null && props.activated) {
		enableTransition.value = true;
		rootEl.value.offsetHeight; // reflow
		transform.value.x = 0;
		transform.value.y = 0;
		transform.value.scale = 1;

		nextTick(() => {
			props.image.sourceElement.style.visibility = 'hidden';
		});
	}
}, { once: true });

function onCLick() {
	if (!isClick) return;

	if (!isTouchUsing) {
		if (isZooming.value) {
			isZooming.value = false;
			resetToNeutral();
		} else {
			closeThis();
		}
	}
}
</script>

<style lang="scss" module>
.root {
	position: absolute;
	width: 100%;
	height: 100%;
}

.main {
	position: absolute;
	touch-action: none;
	width: 100%;
	height: 100%;
}

.image {
	display: block;
	user-select: none;
	position: absolute;
	top: v-bind("headerAreaSize + 'px'");
	left: 0;
	right: 0;
	bottom: v-bind("footerAreaSize + 'px'");
	margin: auto;
}

.loading {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 2;
	display: grid;
	place-items: center;
	pointer-events: none;
}

.transformer {
	width: 100%;
	height: 100%;
	transform-origin: left top;
}

.transition {
	transition: translate 200ms ease, scale 200ms ease;
}

.footer {
	position: absolute;
	bottom: -30px;
	left: 0;
	right: 0;
	margin: auto;
	width: max-content;
	height: 35px;
	padding: 0 12px;
	box-sizing: border-box;
	border-radius: 10px;
	background: var(--MI_THEME-panel);
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 85%;
	color: var(--MI_THEME-fg);
	opacity: 0;
	transition: opacity 200ms ease, bottom 200ms ease;
}
.footer.infoShowing {
	bottom: 10px;
	opacity: 1;
}
.footerText {
}
</style>
