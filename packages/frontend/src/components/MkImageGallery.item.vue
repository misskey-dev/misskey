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
			<div :class="[$style.contentWrapper, { [$style.hideForFallback]: hideForFallback }]">
				<img
					v-if="(!originalContentLoaded || !thumbnailContentLoaded) && (content.thumbnailUrl != null)"
					:class="[$style.content, $style.thumbnail]"
					:src="content.thumbnailUrl"
					draggable="false"
					@load="thumbnailContentLoaded = true"
				>

				<template v-if="activated">
					<img
						v-if="content.type === 'image'"
						:class="[$style.content, $style.original]"
						:src="content.url"
						draggable="false"
						@load="originalContentLoaded = true"
					>
					<video
						v-else-if="content.type === 'video'"
						:id="videoElId"
						ref="videoEl"
						:class="[$style.content, $style.original]"
						:src="content.url"
						draggable="false"
						loop
						autoplay
						playsinline
						@loadedmetadata="originalContentLoaded = true"
					></video>
				</template>

				<div v-if="activated && !originalContentLoaded" :class="$style.loading">
					<MkLoading/>
				</div>
			</div>
		</div>
	</div>

	<div :class="[$style.header, { [$style.infoShowing]: infoShowing && !isZooming }]">
		<div :class="$style.title" class="_acrylic">
			<button class="_button" :class="$style.titleButton"><i class="ti ti-x" @click="closeThis"></i></button>
			<div style="flex: 1; min-width: 0;">
				<MkCondensedLine :minScale="0.5">{{ content.comment ?? content.filename }}</MkCondensedLine>
			</div>
			<button class="_button" :class="$style.titleButton"><i class="ti ti-x" @click="closeThis"></i></button>
		</div>
	</div>

	<div :class="[$style.footer, { [$style.infoShowing]: infoShowing && !isZooming }]">
		<div v-if="content.type === 'video'" :class="$style.mediaControl">
			<MkVideoContol v-if="videoEl != null" :videoElId="videoElId"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
type Size = {
	width: number;
	height: number;
};

type Rect = Size & {
	left: number;
	top: number;
};

export type Content = {
	id: string;
	type: 'image' | 'video';
	url: string;
	thumbnailUrl?: string | null;
	width?: number | null;
	height?: number | null;
	filename?: string | null;
	comment?: string | null;
	sourceElement?: HTMLElement | null;
};

export function calculateSourceTransform({
	fit,
	contentRenderingRect,
	sourceRect,
}: {
	fit: string;
	contentRenderingRect: Rect;
	sourceRect: Rect;
}): { x: number; y: number; scale: number } {
	const scale = fit === 'cover'
		? Math.max(sourceRect.width / contentRenderingRect.width, sourceRect.height / contentRenderingRect.height)
		: Math.min(sourceRect.width / contentRenderingRect.width, sourceRect.height / contentRenderingRect.height);

	const sourceContentWidth = contentRenderingRect.width * scale;
	const sourceContentHeight = contentRenderingRect.height * scale;
	const sourceContentLeft = sourceRect.left + (sourceRect.width - sourceContentWidth) / 2;
	const sourceContentTop = sourceRect.top + (sourceRect.height - sourceContentHeight) / 2;

	return {
		x: sourceContentLeft - contentRenderingRect.left * scale,
		y: sourceContentTop - contentRenderingRect.top * scale,
		scale,
	};
}
</script>

<script lang="ts" setup>
import { markRaw, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import MkVideoContol from './MkVideoContol.vue';
import { i18n } from '@/i18n.js';
import { makeDoubleTapDetector } from '@/utility/double-tap.js';
import { deviceKind } from '@/utility/device-kind.js';
import { isTouchUsing } from '@/utility/touch.js';
import { genId } from '@/utility/id.js';

const props = withDefaults(defineProps<{
	content: Content;
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
const videoEl = useTemplateRef('videoEl');
const videoElId = genId();

const originalContentLoaded = ref(false);
const thumbnailContentLoaded = ref(false);
const enableTransition = ref(false);
const infoShowing = ref(false);
let canOpenAnimation = false;

onMounted(() => {
	if (rootEl.value == null) return;
	rootEl.value.offsetHeight; // reflow
	infoShowing.value = true;
});

const headerSize = 30;
const footerSize = props.content.type === 'video' ? 80 : 0;

const padding = deviceKind === 'smartphone' ? {
	top: Math.max(0, headerSize + 10),
	right: 0,
	bottom: Math.max(0, footerSize + 10),
	left: 0,
} : {
	top: Math.max(30, headerSize + 10),
	right: 30,
	bottom: Math.max(30, footerSize + 10),
	left: 30,
};

// maxからはみ出す場合は縮小、maxに満たない場合は拡大する(contain)
function calcContentRenderingSize(content: Content) {
	if (content.width == null || content.height == null || content.width === 0 || content.height === 0) return null;

	const maxWidth = window.innerWidth - padding.left - padding.right;
	const maxHeight = window.innerHeight - padding.top - padding.bottom;

	const widthRatio = maxWidth / content.width;
	const heightRatio = maxHeight / content.height;
	const ratio = widthRatio < heightRatio ? widthRatio : heightRatio;

	const width = content.width * ratio;
	const height = content.height * ratio;

	return { width, height };
}

const contentRenderingSize = calcContentRenderingSize(props.content);
const contentRenderingRect = contentRenderingSize != null ? {
	left: (window.innerWidth - contentRenderingSize.width + padding.left - padding.right) / 2,
	top: (window.innerHeight - contentRenderingSize.height + padding.top - padding.bottom) / 2,
	width: contentRenderingSize.width,
	height: contentRenderingSize.height,
} : null;
const transform = ref({ x: 0, y: 0, scale: 1 });

// 元のimg要素の位置・サイズ(とobject-fitの設定値)を取得して、そこからneutralの位置にアニメーションするためのscaleとtranslationを計算する
function getScaleAndTranslationForSourceElement() {
	const sourceElement = props.content.sourceElement;
	if (sourceElement == null || contentRenderingRect == null) return null;

	return calculateSourceTransform({
		fit: window.getComputedStyle(sourceElement).objectFit,
		contentRenderingRect,
		sourceRect: sourceElement.getBoundingClientRect(),
	});
}

if (props.content.sourceElement != null && props.activated) {
	const sourceTransform = getScaleAndTranslationForSourceElement();
	if (sourceTransform != null) {
		transform.value.scale = sourceTransform.scale;
		transform.value.x = sourceTransform.x;
		transform.value.y = sourceTransform.y;
		canOpenAnimation = true;
	}
}

const hideForFallback = ref(!canOpenAnimation);

const isZooming = ref(false);

function zoomInTo(x: number, y: number, factor = 1.1, withAnimation = false) {
	if (mainEl.value == null) return;

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
	if (rootEl.value == null) return;

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

	if (rootEl.value == null) return;

	const sourceTransform = getScaleAndTranslationForSourceElement();
	if (sourceTransform != null) {
		enableTransition.value = true;
		rootEl.value.offsetHeight; // reflow
		transform.value.x = sourceTransform.x;
		transform.value.y = sourceTransform.y;
		transform.value.scale = sourceTransform.scale;
	} else {
		hideForFallback.value = true;
	}
}

onMounted(() => {
	rootEl.value.offsetHeight; // reflow
	hideForFallback.value = false;
});

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
	if (mainEl.value == null) return;
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
	if (mainEl.value == null) return;
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

// これがないと例えばiOSで画像長押しでのコンテキストメニューを表示させた後にそれを閉じるとタッチ判定が残ったままになり不具合の原因になる
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

//#region inertia
let rafHandle: ReturnType<typeof window['requestAnimationFrame']> | null = null;
let latestInertiaTimeStamp = 0;
const inertiaFactor = 0.9;

function updateInertia(timeStamp: number) {
	rafHandle = window.requestAnimationFrame(updateInertia);
	const timeDelta = timeStamp - latestInertiaTimeStamp;
	latestInertiaTimeStamp = timeStamp;
	if (timeDelta > 100) return;

	if (isDragging) return;
	if (!isZooming.value) return;
	if (Math.abs(pointerVec.x) < 0.01 && Math.abs(pointerVec.y) < 0.01) return;
	transform.value.x += pointerVec.x * timeDelta;
	transform.value.y += pointerVec.y * timeDelta;
	pointerVec.x *= inertiaFactor ** (timeDelta / 16.67);
	pointerVec.y *= inertiaFactor ** (timeDelta / 16.67);
}

watch(isZooming, () => {
	pointerVec = { x: 0, y: 0 };
	if (isZooming.value) {
		rafHandle = window.requestAnimationFrame(updateInertia);
	} else {
		if (rafHandle != null) window.cancelAnimationFrame(rafHandle);
	}
});
//#endregion

watch(thumbnailContentLoaded, () => {
	if (rootEl.value == null) return;

	const sourceElement = props.content.sourceElement;
	if (sourceElement != null && props.activated) {
		enableTransition.value = true;
		rootEl.value.offsetHeight; // reflow
		transform.value.x = 0;
		transform.value.y = 0;
		transform.value.scale = 1;

		nextTick(() => {
			sourceElement.style.visibility = 'hidden';
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

.content {
	display: block;
	user-select: none;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	margin: auto;
	width: 100%;
	height: 100%;
	object-fit: contain;
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
	box-sizing: border-box;
	padding: v-bind("padding.top + 'px'") v-bind("padding.right + 'px'") v-bind("padding.bottom + 'px'") v-bind("padding.left + 'px'");
	transform-origin: left top;
}

.transition {
	transition: translate 200ms ease, scale 200ms ease;
}

.contentWrapper {
	position: relative;
	width: 100%;
	height: 100%;
	transition: scale 200ms ease, opacity 200ms ease !important;
}

.hideForFallback {
	scale: 0.7 !important;
	opacity: 0 !important;
}

.footer {
	position: absolute;
	bottom: v-bind("-footerSize + 'px'");
	left: 0;
	right: 0;
	height: v-bind("footerSize + 'px'");
	opacity: 0;
	transition: opacity 200ms ease, bottom 200ms ease;
}
.footer.infoShowing {
	bottom: 0px;
	opacity: 1;
}
.header {
	position: absolute;
	top: v-bind("-headerSize + 'px'");
	left: 0;
	right: 0;
	height: v-bind("headerSize + 'px'");
	opacity: 0;
	transition: opacity 200ms ease, top 200ms ease;
}
.header.infoShowing {
	top: 0px;
	opacity: 1;
}

.title {
	display: flex;
	width: max-content;
	max-width: calc(100% - 20px);
	margin: auto;
	padding: 6px 0px;
	box-sizing: border-box;
	border-radius: 0 0 10px 10px;
	font-size: 85%;
}
.titleButton {
	width: 30px;
}

.mediaControl {
	width: 100%;
	height: 100%;
	max-width: min(1000px, calc(100% - 16px));
	box-sizing: border-box;
	padding: 8px 12px;
	margin: auto;
	background: var(--MI_THEME-panel);
	border-radius: 12px 12px 0 0;
}
</style>
