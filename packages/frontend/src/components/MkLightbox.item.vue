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
		@click="onClick"
	>
		<div
			:class="[$style.transformer, { [$style.transition]: enableTransition }]"
			:style="{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }"
			@transitionend.self="enableTransition = false"
			@transitioncancel.self="enableTransition = false"
		>
			<div :class="[$style.contentWrapper, { [$style.hideForFallback]: hideForFallback }]">
				<div
					v-if="hide"
					data-gallery-click-action="hidden"
					:class="[$style.hidden, {
						[$style.sensitive]: content.file?.isSensitive && prefer.s.highlightSensitiveMedia,
					}]"
					:style="hiddenStyle"
					@click.stop="onHiddenClick"
				>
					<div :class="$style.hiddenWrapper">
						<MkBlurhash
							v-if="content.type === 'image' && content.file?.blurhash != null"
							:class="$style.hiddenBlurhash"
							:blurhash="content.file.blurhash ?? null"
							:height="content?.height ?? undefined"
							:width="content?.width ?? undefined"
						/>
						<img
							v-else-if="content.type === 'video' && content.thumbnailUrl != null"
							:src="content.thumbnailUrl"
							:class="$style.hiddenThumbnail"
						/>
						<div v-else :class="$style.hiddenPlaceholder"></div>
						<div :class="[$style.hiddenText, { [$style.withBlur]: content.type === 'video' && content.thumbnailUrl != null }]">
							<div :class="$style.hiddenTextWrapper">
								<b v-if="content.file?.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}</b>
								<b v-else style="display: block;"><i class="ti" :class="content.type === 'image' ? 'ti-photo' : 'ti-movie'"></i> {{ content.type === 'image' ? i18n.ts.image : i18n.ts.video }}</b>
								<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
							</div>
						</div>
					</div>
				</div>
				<template v-else>
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
							:class="$style.content"
							:src="content.url"
							:alt="content.file?.comment ?? undefined"
							draggable="false"
							@load="originalContentLoaded = true"
						>
						<video
							v-else-if="content.type === 'video'"
							ref="videoEl"
							data-gallery-click-action="video"
							:class="$style.content"
							:src="content.url"
							:alt="content.file?.comment ?? undefined"
							draggable="false"
							:controls="prefer.s.useNativeUiForVideoAudioPlayer"
							playsinline
							@loadedmetadata="originalContentLoaded = true"
							@click.stop="onVideoClick"
						></video>
						<div v-if="content.type === 'video' && !prefer.s.useNativeUiForVideoAudioPlayer && !isVideoPlaying" data-gallery-click-action="video" :class="$style.playIconWrapper">
							<div :class="$style.playIcon">
								<i class="ti ti-player-play"></i>
							</div>
						</div>
					</template>

					<div v-if="activated && (!originalContentLoaded || (content.type === 'video' && isVideoPlaying && !isVideoActuallyPlaying))" :class="$style.loading">
						<MkLoading/>
					</div>
				</template>
			</div>
		</div>
	</div>

	<div :class="[$style.header, { [$style.infoShowing]: infoShowing && !isZooming }]">
		<div :class="$style.title" class="_acrylic">
			<button class="_button" :class="$style.titleButton" @click="openMenu"><i class="ti ti-dots"></i></button>
			<div :class="$style.titleText">
				<MkCondensedLine :minScale="0.5">{{ content.filename }}</MkCondensedLine>
			</div>
			<button class="_button" :class="$style.titleButton" @click="closeThis"><i class="ti ti-x"></i></button>
		</div>
	</div>

	<div :class="[$style.footer, { [$style.infoShowing]: infoShowing && !isZooming }]">
		<div v-if="content.type === 'video' && !hide && !prefer.s.useNativeUiForVideoAudioPlayer" :class="$style.mediaControl">
			<MkVideoControl v-if="videoEl != null" ref="videoControl" :videoEl="videoEl"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import * as Misskey from 'misskey-js';
import MkBlurhash from './MkBlurhash.vue';

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
	file?: Misskey.entities.DriveFile;
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
import { computed, nextTick, ref, useTemplateRef, markRaw, watch, provide } from 'vue';
import MkVideoControl from './MkVideoControl.vue';
import XFileInfo from './MkLightbox.item.fileinfo.vue';
import type { MenuItem } from '@/types/menu.js';
import { DI } from '@/di.js';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';
import { makeDoubleTapDetector } from '@/utility/double-tap.js';
import { deviceKind } from '@/utility/device-kind.js';
import { isTouchUsing } from '@/utility/touch.js';
import { getFileMenu } from '@/utility/get-file-menu.js';

const props = withDefaults(defineProps<{
	content: Content;
	activated: boolean;
	initiallyOpened?: boolean;
}>(), {
	initiallyOpened: false,
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
const videoControl = useTemplateRef('videoControl');

provide(DI.mkLightboxItemVideoEl, videoEl);

const originalContentLoaded = ref(false);
const thumbnailContentLoaded = ref(false);
const enableTransition = ref(false);
const infoShowing = ref(false);
const hide = ref(true);
const isVideoPlaying = computed(() => videoControl.value?.isPlaying ?? false);
const isVideoActuallyPlaying = computed(() => videoControl.value?.isActuallyPlaying ?? false);
let canOpenAnimation = false;

const headerSize = 30;
const footerSize = props.content.type === 'video' && !prefer.s.useNativeUiForVideoAudioPlayer ? 80 : 0;

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
const getContentRenderingRect = () => contentRenderingSize != null ? {
	left: (window.innerWidth - contentRenderingSize.width + padding.left - padding.right) / 2,
	top: (window.innerHeight - contentRenderingSize.height + padding.top - padding.bottom) / 2,
	width: contentRenderingSize.width,
	height: contentRenderingSize.height,
} : null;

const hiddenStyle = computed(() => {
	if (contentRenderingSize == null) {
		return {
			width: '100%',
			height: '100%',
		};
	}

	return {
		width: `${contentRenderingSize.width}px`,
		height: `${contentRenderingSize.height}px`,
	};
});

function shouldHideInGallery(content: Content): boolean {
	if (content.file == null) return false;
	const hiddenByDefault = shouldHideFileByDefault(content.file, true);
	if (!hiddenByDefault) return false;

	// ギャラリー起動時に最初に開いたセンシティブ画像だけは初期表示で隠さない
	if (content.file.isSensitive && prefer.s.nsfw !== 'force' && props.initiallyOpened) {
		return false;
	}

	return true;
}

function isValidRect(rect: Rect | null): rect is Rect {
	return rect != null && rect.width > 0 && rect.height > 0;
}

const transform = ref({ x: 0, y: 0, scale: 1 });

// 元のimg要素の位置・サイズ(とobject-fitの設定値)を取得して、そこからneutralの位置にアニメーションするためのscaleとtranslationを計算する
function getScaleAndTranslationForSourceElement() {
	const sourceElement = props.content.sourceElement;
	const contentRenderingRect = getContentRenderingRect();
	if (sourceElement == null || !isValidRect(contentRenderingRect)) return null;
	const sourceElementRect = sourceElement.getBoundingClientRect();
	if (!isValidRect(sourceElementRect)) return null;

	return calculateSourceTransform({
		fit: window.getComputedStyle(sourceElement).objectFit,
		contentRenderingRect,
		sourceRect: sourceElementRect,
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

function clampZoomTransform(nextTransform: { x: number; y: number; scale: number }) {
	if (mainEl.value == null || nextTransform.scale <= 1) {
		return {
			x: 0,
			y: 0,
			scale: nextTransform.scale,
		};
	}

	const panMargin = 24;
	const rect = mainEl.value.getBoundingClientRect();
	const minX = rect.width - rect.width * nextTransform.scale - panMargin;
	const minY = rect.height - rect.height * nextTransform.scale - panMargin;
	const maxX = panMargin;
	const maxY = panMargin;

	return {
		x: Math.min(maxX, Math.max(minX, nextTransform.x)),
		y: Math.min(maxY, Math.max(minY, nextTransform.y)),
		scale: nextTransform.scale,
	};
}

function zoomInTo(x: number, y: number, factor = 1.1, withAnimation = false, clamp = true) {
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

	transform.value = clamp
		? clampZoomTransform({
			x: newTranslationX,
			y: newTranslationY,
			scale: newScale,
		})
		: {
			x: newTranslationX,
			y: newTranslationY,
			scale: newScale,
		};
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
	zoomInTo(ev.centerX, ev.centerY, 1 + ev.delta / 200, false, false);
}

function onZoomGestureEnd() {
	if (transform.value.scale < 1) {
		isZooming.value = false;
		resetToNeutral();
		return;
	}

	const clampedTransform = clampZoomTransform(transform.value);
	if (clampedTransform.x === transform.value.x && clampedTransform.y === transform.value.y && clampedTransform.scale === transform.value.scale) {
		return;
	}

	enableTransition.value = true;
	transform.value = clampedTransform;
}

let isDragging = false;
let isClick = false;
let clickAction: 'hidden' | 'video' | null = null;
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

function resolveClickAction(target: EventTarget | null): 'hidden' | 'video' | null {
	if (!(target instanceof Element)) return null;

	const action = target.closest('[data-gallery-click-action]')?.getAttribute('data-gallery-click-action');
	if (action === 'hidden' || action === 'video') {
		return action;
	}

	return null;
}

function onPointerdown(ev: PointerEvent) {
	if (mainEl.value == null) return;
	pointerEventCache.set(ev.pointerId, ev);
	mainEl.value.setPointerCapture(ev.pointerId);

	isDragging = true;
	isClick = true;
	clickAction = resolveClickAction(ev.target);
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
			transform.value = clampZoomTransform({
				x: transform.value.x + deltaX,
				y: transform.value.y + deltaY,
				scale: transform.value.scale,
			});
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
	clickAction = null;
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
	transform.value = clampZoomTransform({
		x: transform.value.x + pointerVec.x * timeDelta,
		y: transform.value.y + pointerVec.y * timeDelta,
		scale: transform.value.scale,
	});
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

function animateFromSourceToNeutral() {
	if (rootEl.value == null) return;

	const sourceElement = props.content.sourceElement;
	if (sourceElement == null || !props.activated) return;

	enableTransition.value = true;
	rootEl.value.offsetHeight; // reflow
	transform.value.x = 0;
	transform.value.y = 0;
	transform.value.scale = 1;

	nextTick(() => {
		sourceElement.style.visibility = 'hidden';
	});
}

watch(thumbnailContentLoaded, () => {
	animateFromSourceToNeutral();
}, { once: true });

watch([rootEl, hide], ([newRootEl, isHidden]) => {
	if (newRootEl == null || !isHidden) return;
	animateFromSourceToNeutral();
}, { immediate: true });

watch(props.content, (newContent) => {
	hide.value = shouldHideInGallery(newContent);
}, { deep: true, immediate: true });

watch(rootEl, (newRootEl) => {
	if (newRootEl == null) return;

	infoShowing.value = true;
	newRootEl.offsetHeight; // reflow
	hideForFallback.value = false;
}, { immediate: true });

function onClick(ev: MouseEvent) {
	if (!isClick) return;

	const action = clickAction ?? resolveClickAction(ev.target);
	clickAction = null;

	if (action === 'hidden') {
		void onHiddenClick();
		return;
	}

	if (action === 'video') {
		onVideoClick();
		return;
	}

	if (!isTouchUsing) {
		if (isZooming.value) {
			isZooming.value = false;
			resetToNeutral();
		} else {
			closeThis();
		}
	}
}

async function onHiddenClick() {
	if (hide.value) {
		if (props.content.file == null || await canRevealFile(props.content.file)) {
			hide.value = false;
			if (props.content.type === 'video' && videoEl.value != null) {
				videoEl.value.play();
			}
		}
	}
}

function onVideoClick() {
	if (!prefer.s.useNativeUiForVideoAudioPlayer) {
		if (videoEl.value == null) return;

		if (videoEl.value.paused) {
			videoEl.value.play();
		} else {
			videoEl.value.pause();
		}
	}
}

function openMenu(ev: PointerEvent) {
	const menu: MenuItem[] = [];

	// isTouchUsingにする？
	menu.push({
		type: 'component',
		component: markRaw(XFileInfo),
		props: {
			content: props.content,
		},
	}, {
		type: 'divider',
	});

	menu.push({
		text: i18n.ts.hide,
		icon: 'ti ti-eye-off',
		action: () => {
			hide.value = true;
		},
	});

	if (props.content.file != null) {
		menu.push({ type: 'divider' });
		menu.push(...getFileMenu(props.content.file));
	}

	os.popupMenu(menu, (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onActive() {
	if (videoEl.value != null) {
		videoEl.value.play();
	}
}

function onDeactive() {
	if (isZooming.value) {
		isZooming.value = false;
		resetToNeutral();
	}
	if (videoEl.value != null && props.activated) {
		videoEl.value.pause();
	}
}

defineExpose({
	onActive,
	onDeactive,
	closeThis,
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
	width: 100%;
	height: 100%;
	container-type: size;
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
	transition: transform 200ms ease;
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

.playIconWrapper {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
}

.playIcon {
	display: grid;
	place-items: center;
	width: 50px;
	height: 50px;
	border-radius: 100%;
	font-size: 120%;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	scale: 1;
	transition: scale 100ms ease;
}

.playIconWrapper:hover .playIcon,
.playIcon:hover {
	scale: 1.2;
}

.hidden {
	position: absolute;
	inset: 0;
	margin: auto;
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
	overflow: clip;

	&.sensitive::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
}

.hiddenWrapper {
	position: relative;
	width: 100%;
	max-height: 100%;
	min-height: 0;
}

.hiddenBlurhash {
	display: block;
	width: 100%;
	height: 100%;
	filter: brightness(0.7);
}

.hiddenThumbnail {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	filter: brightness(0.7);
}

.hiddenPlaceholder {
	width: 100%;
	height: auto;
	aspect-ratio: 16 / 9;
	background: #000;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
	cursor: pointer;
	color: #fff;

	&.withBlur {
		backdrop-filter: blur(12px);
	}
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
	align-items: center;
	width: max-content;
	max-width: calc(100% - 20px);
	margin: auto;
	box-sizing: border-box;
	border-radius: 0 0 10px 10px;
	font-size: 85%;
}

.titleButton {
	flex-shrink: 0;
	width: 32px;
	height: 32px;
}

.titleText {
	flex-grow: 1;
	height: 100%;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	padding: 6px 0px;
}

.mediaControl {
	width: 100%;
	height: 100%;
	max-width: min(1000px, calc(100% - 16px));
	box-sizing: border-box;
	padding: 12px 20px;
	margin: auto;
	background: var(--MI_THEME-panel);
	border-radius: 12px 12px 0 0;
}

@container (max-width: 500px) {
	.mediaControl {
		padding: 8px 12px;
	}
}
</style>
