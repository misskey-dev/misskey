<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="$style.root"
	@pointerdown="onPointerdown"
	@pointermove.passive="onPointermove"
	@pointerup="onPointerup"
	@touchstart="onTouchstart"
	@touchmove.passive="onTouchmove"
	@wheel="onWheel"
>
	<div :style="{ transform: `translate3d(${translation.x}px, ${translation.y}px, 0)` }">
		<img
			v-if="!originalImageLoaded"
			:class="[$style.image, $style.thumbnail]"
			:src="image.thumbnailUrl"
			:width="size.width"
			:height="size.height"
			draggable="false"
		>
		<img
			v-if="activated"
			ref="imageEl"
			:class="[$style.image, $style.original]"
			:src="image.url"
			:width="size.width"
			:height="size.height"
			draggable="false"
			@load="originalImageLoaded = true"
		>
	</div>
	<div v-if="activated && !originalImageLoaded" :class="$style.loading">
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { makeDoubleTapDetector } from '@/utility/double-tap.js';
import { beginAnimation, easing_easeInOutQuad } from '@/utility/animation.js';

export type Image = {
	id: string;
	url: string;
	thumbnailUrl: string;
	width: number;
	height: number;
	sourceElement?: HTMLElement;
};

const props = withDefaults(defineProps<{
	image: Image;
	activated: boolean;
	openAnimDuration: number;
	closeAnimDuration: number;
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
const imageEl = useTemplateRef('imageEl');

const originalImageLoaded = ref(false);

const padding = 30;
const ANIMATION_DURATION = 200;

// maxからはみ出す場合は縮小、maxに満たない場合は拡大する(contain)
function calcNeutralSize(image: Image) {
	const maxWidth = window.innerWidth - padding * 2;
	const maxHeight = window.innerHeight - padding * 2;

	const widthRatio = maxWidth / image.width;
	const heightRatio = maxHeight / image.height;
	const ratio = widthRatio < heightRatio ? widthRatio : heightRatio;

	const width = image.width * ratio;
	const height = image.height * ratio;

	return { width, height };
}

function calcNeutralTranslation(image: Image) {
	const defaultSize = calcNeutralSize(image);

	const x = (window.innerWidth - defaultSize.width) / 2;
	const y = (window.innerHeight - defaultSize.height) / 2;

	return { x, y };
}

const neutralSize = calcNeutralSize(props.image);
const neutralTranslation = calcNeutralTranslation(props.image);

const size = ref({ width: neutralSize.width, height: neutralSize.height });
const translation = ref({ x: neutralTranslation.x, y: neutralTranslation.y });

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
			from: {
				width: size.value.width,
				height: size.value.height,
				x: translation.value.x,
				y: translation.value.y,
			},
			to: {
				width: newWidth,
				height: newHeight,
				x: translation.value.x - offsetX * (factor - 1),
				y: translation.value.y - offsetY * (factor - 1),
			},
			duration: ANIMATION_DURATION,
			easing: easing_easeInOutQuad,
			apply: (state) => {
				size.value.width = state.width;
				size.value.height = state.height;
				translation.value.x = state.x;
				translation.value.y = state.y;
			},
		});
	} else {
		size.value.width = newWidth;
		size.value.height = newHeight;
		translation.value.x -= offsetX * (factor - 1);
		translation.value.y -= offsetY * (factor - 1);
	}
}

function resetToNeutral() {
	isZooming.value = false;
	beginAnimation({
		from: {
			width: size.value.width,
			height: size.value.height,
			x: translation.value.x,
			y: translation.value.y,
		},
		to: {
			width: neutralSize.width,
			height: neutralSize.height,
			x: neutralTranslation.x,
			y: neutralTranslation.y,
		},
		duration: ANIMATION_DURATION,
		easing: easing_easeInOutQuad,
		apply: (state) => {
			size.value.width = state.width;
			size.value.height = state.height;
			translation.value.x = state.x;
			translation.value.y = state.y;
		},
	});
}

function onWheel(event: WheelEvent) {
	event.preventDefault();

	const delta = event.deltaY;

	const scaleFactor = 1.1;
	const scale = delta > 0 ? 1 / scaleFactor : scaleFactor;

	const newWidth = size.value.width * scale;
	const newHeight = size.value.height * scale;

	if (newWidth < neutralSize.width || newHeight < neutralSize.height) {
		size.value.width = neutralSize.width;
		size.value.height = neutralSize.height;
		translation.value.x = neutralTranslation.x;
		translation.value.y = neutralTranslation.y;
		isZooming.value = false;
		return;
	}

	zoomInTo(event.clientX, event.clientY, scale);
}

function onZoomGesture(ev: { delta: number; centerX: number; centerY: number }) {
	zoomInTo(ev.centerX, ev.centerY, 1 + ev.delta / 200);
}

function onZoomGestureEnd() {
	if (size.value.width < neutralSize.width || size.value.height < neutralSize.height) {
		isZooming.value = false;
		resetToNeutral();
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
let horizontalSwipeDelta = 0;

const pointerEventCache = new Map<number, PointerEvent>();
let pointerVec = { x: 0, y: 0 };

function onPointerdown(ev: PointerEvent) {
	pointerEventCache.set(ev.pointerId, ev);
	rootEl.value.setPointerCapture(ev.pointerId);

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
				//translation.value.x += deltaX;
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
	rootEl.value.releasePointerCapture(ev.pointerId);
	prevTwoTouchPointsDistance = 0;
	isDragging = false;
	if (currentPointerId === ev.pointerId) {
		currentPointerId = null;

		if (isVerticalSwiping) {
			const shouldCloseByUpwardSwipe = verticalSwipeDelta < -200 || (verticalSwipeDelta < 0 && pointerVec.y < -3); // 上の方で離された、または上に向かって強めに弾かれた
			const shouldCloseByDownwardSwipe = verticalSwipeDelta > 200 || (verticalSwipeDelta > 0 && pointerVec.y > 3); // 下の方で離された、または下に向かって強めに弾かれた
			if (shouldCloseByUpwardSwipe || shouldCloseByDownwardSwipe) {
				emit('close');
				//beginAnimation({
				//	from: {
				//		x: translation.value.x,
				//		y: translation.value.y,
				//	},
				//	to: {
				//		x: translation.value.x,
				//		y: translation.value.y + (shouldCloseByUpwardSwipe ? -window.innerHeight : window.innerHeight),
				//	},
				//	duration: 200,
				//	easing: easing_easeInOutQuad,
				//	apply: (state) => {
				//		translation.value.x = state.x;
				//		translation.value.y = state.y;
				//	},
				//});
				const sourceRect = getSizeAndTranslationForSourceElement();
				beginAnimation({
					from: {
						width: size.value.width,
						height: size.value.height,
						x: translation.value.x,
						y: translation.value.y,
					},
					to: {
						width: sourceRect.width,
						height: sourceRect.height,
						x: sourceRect.x,
						y: sourceRect.y,
					},
					duration: props.closeAnimDuration,
					easing: easing_easeInOutQuad,
					apply: (state) => {
						size.value.width = state.width;
						size.value.height = state.height;
						translation.value.x = state.x;
						translation.value.y = state.y;
					},
				});
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
	translation.value.x += pointerVec.x;
	translation.value.y += pointerVec.y;
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

function getSizeAndTranslationForSourceElement() {
	const elementStyles = window.getComputedStyle(props.image.sourceElement);
	const fit = elementStyles.objectFit;

	const sourceRect = props.image.sourceElement.getBoundingClientRect();
	if (fit === 'contain') {
		const sourceAspectRatio = sourceRect.width / sourceRect.height;
		const imageAspectRatio = props.image.width / props.image.height;

		if (sourceAspectRatio > imageAspectRatio) { // 横長
			const newWidth = sourceRect.height * imageAspectRatio;
			const newHeight = sourceRect.height;
			return {
				width: newWidth,
				height: newHeight,
				x: sourceRect.left + (sourceRect.width - newWidth) / 2,
				y: sourceRect.top,
			};
		} else { // 縦長
			const newWidth = sourceRect.width;
			const newHeight = sourceRect.width / imageAspectRatio;
			return {
				width: newWidth,
				height: newHeight,
				x: sourceRect.left,
				y: sourceRect.top + (sourceRect.height - newHeight) / 2,
			};
		}
	} else {
		return {
			width: sourceRect.width,
			height: sourceRect.height,
			x: sourceRect.left,
			y: sourceRect.top,
		};
	}
}

onMounted(() => {
	// 画像の初期位置・サイズをsourceElementの位置に合わせてneutralの位置にアニメーションする
	if (props.image.sourceElement != null && props.activated) {
		const sourceRect = getSizeAndTranslationForSourceElement();
		size.value.width = sourceRect.width;
		size.value.height = sourceRect.height;
		translation.value.x = sourceRect.x;
		translation.value.y = sourceRect.y;

		beginAnimation({
			from: {
				width: size.value.width,
				height: size.value.height,
				x: translation.value.x,
				y: translation.value.y,
			},
			to: {
				width: neutralSize.width,
				height: neutralSize.height,
				x: neutralTranslation.x,
				y: neutralTranslation.y,
			},
			duration: props.openAnimDuration,
			easing: easing_easeInOutQuad,
			apply: (state) => {
				size.value.width = state.width;
				size.value.height = state.height;
				translation.value.x = state.x;
				translation.value.y = state.y;
			},
		});
	}
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
	touch-action: none;
	width: 100%;
	height: 100%;
}

.image {
	display: block;
	-webkit-touch-callout: none;
	user-select: none;
	position: absolute;
	top: 0;
	left: 0;
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
</style>
