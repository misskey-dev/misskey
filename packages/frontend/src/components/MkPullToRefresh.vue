<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="isPulling ? $style.isPulling : null">
	<!-- 小数が含まれるとレンダリングが高頻度になりすぎパフォーマンスが悪化するためround -->
	<div v-if="isPulling" :class="$style.frame" :style="`--frame-min-height: ${Math.round(pullDistance / (PULL_BRAKE_BASE + (pullDistance / PULL_BRAKE_FACTOR)))}px;`">
		<div :class="$style.frameContent">
			<MkLoading v-if="isRefreshing" :class="$style.loader" :em="true"/>
			<i v-else class="ti ti-arrow-bar-to-down" :class="[$style.icon, { [$style.refresh]: isPulledEnough }]"></i>
			<div :class="$style.text">
				<template v-if="isPulledEnough">{{ i18n.ts.releaseToRefresh }}</template>
				<template v-else-if="isRefreshing">{{ i18n.ts.refreshing }}</template>
				<template v-else>{{ i18n.ts.pullDownToRefresh }}</template>
			</div>
		</div>
	</div>

	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { getScrollContainer } from '@@/js/scroll.js';
import { i18n } from '@/i18n.js';
import { isHorizontalSwipeSwiping } from '@/utility/touch.js';
import { haptic } from '@/utility/haptic.js';

const SCROLL_STOP = 10;
const MAX_PULL_DISTANCE = Infinity;
const FIRE_THRESHOLD = 200;
const RELEASE_TRANSITION_DURATION = 200;
const PULL_BRAKE_BASE = 1.5;
const PULL_BRAKE_FACTOR = 170;

const isPulling = ref(false);
const isPulledEnough = ref(false);
const isRefreshing = ref(false);
const pullDistance = ref(0);

let startScreenY: number | null = null;
let pullingPointerId: number | null = null;

const rootEl = useTemplateRef('rootEl');
let scrollEl: HTMLElement | null = null;

const props = withDefaults(defineProps<{
	refresher: () => Promise<void>;
}>(), {
	refresher: () => Promise.resolve(),
});

const emit = defineEmits<{
	(ev: 'refresh'): void;
}>();

function detachPullListeners() {
	if (rootEl.value == null) return;
	rootEl.value.removeEventListener('pointermove', onPullPointerMove);
	rootEl.value.removeEventListener('pointerup', onPullPointerUpOrCancel);
	rootEl.value.removeEventListener('pointercancel', onPullPointerUpOrCancel);
}

function safeReleasePointerCapture(pointerId: number | null) {
	if (rootEl.value == null) return;
	if (pointerId == null) return;
	try {
		if (rootEl.value.hasPointerCapture(pointerId)) {
			rootEl.value.releasePointerCapture(pointerId);
		}
	} catch {
		// ignore
	}
}

function cleanupPullInteraction() {
	detachPullListeners();
	safeReleasePointerCapture(pullingPointerId);
	pullingPointerId = null;
	startScreenY = null;
}

// When at the top of the page, disable vertical overscroll so passive touch listeners can take over.
function lockDownScroll() {
	if (scrollEl == null) return;
	scrollEl.style.touchAction = 'pan-x pan-down pinch-zoom';
	scrollEl.style.overscrollBehavior = 'auto none';
}

function unlockDownScroll() {
	if (scrollEl == null) return;
	scrollEl.style.touchAction = 'auto';
	scrollEl.style.overscrollBehavior = 'auto contain';
}

function moveStartByPointer(event: PointerEvent) {
	if (isRefreshing.value) return;
	if (isPulling.value) return;
	if (!event.isPrimary) return;

	// マウス操作は従来通り「中クリックドラッグ」でのみ開始
	if (event.pointerType === 'mouse' && event.button !== 1) return;

	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos !== 0) {
		unlockDownScroll();
		return;
	}

	lockDownScroll();

	if (event.pointerType === 'mouse') {
		// 中クリックによるスクロール、テキスト選択などを防ぐ
		event.preventDefault();
	}

	isPulling.value = true;
	isPulledEnough.value = false;
	startScreenY = event.screenY;
	pullDistance.value = 0;
	pullingPointerId = event.pointerId;

	try {
		rootEl.value?.setPointerCapture(event.pointerId);
	} catch {
		// ignore
	}

	rootEl.value?.addEventListener('pointermove', onPullPointerMove, { passive: true });
	rootEl.value?.addEventListener('pointerup', onPullPointerUpOrCancel, { passive: true });
	rootEl.value?.addEventListener('pointercancel', onPullPointerUpOrCancel, { passive: true });
}

function moveBySystem(to: number): Promise<void> {
	return new Promise(r => {
		const startHeight = pullDistance.value;
		const overHeight = pullDistance.value - to;
		if (overHeight < 1) {
			r();
			return;
		}
		const startTime = Date.now();
		let intervalId = window.setInterval(() => {
			const time = Date.now() - startTime;
			if (time > RELEASE_TRANSITION_DURATION) {
				pullDistance.value = to;
				window.clearInterval(intervalId);
				r();
				return;
			}
			const nextHeight = startHeight - (overHeight / RELEASE_TRANSITION_DURATION) * time;
			if (pullDistance.value < nextHeight) return;
			pullDistance.value = nextHeight;
		}, 1);
	});
}

async function fixOverContent() {
	if (pullDistance.value > FIRE_THRESHOLD) {
		await moveBySystem(FIRE_THRESHOLD);
	}
}

async function closeContent() {
	if (pullDistance.value > 0) {
		await moveBySystem(0);
	}
}

function onPullRelease() {
	cleanupPullInteraction();
	if (isPulledEnough.value) {
		isPulledEnough.value = false;
		isRefreshing.value = true;
		fixOverContent().then(() => {
			emit('refresh');
			props.refresher().then(() => {
				refreshFinished();
			});
		});
	} else {
		closeContent().then(() => isPulling.value = false);
	}
}

function toggleScrollLockOnPointerEnd() {
	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos === 0) {
		lockDownScroll();
	} else {
		unlockDownScroll();
	}
}

function moving(event: PointerEvent) {
	if ((scrollEl?.scrollTop ?? 0) > SCROLL_STOP + pullDistance.value || isHorizontalSwipeSwiping.value) {
		pullDistance.value = 0;
		isPulledEnough.value = false;
		onPullRelease();
		return;
	}

	if (startScreenY === null) {
		startScreenY = event.screenY;
	}
	const moveScreenY = event.screenY;

	const moveHeight = moveScreenY - startScreenY!;
	pullDistance.value = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);

	isPulledEnough.value = pullDistance.value >= FIRE_THRESHOLD;

	if (isPulledEnough.value) haptic();
}

function onPullPointerMove(event: PointerEvent) {
	if (pullingPointerId == null) return;
	if (event.pointerId !== pullingPointerId) return;
	moving(event);
}

function onPullPointerUpOrCancel(event: PointerEvent) {
	if (pullingPointerId == null) return;
	if (event.pointerId !== pullingPointerId) return;
	onPullRelease();
}

function onRootPointerUpOrCancel(event: PointerEvent) {
	// 既存実装の touchend 相当: マウスは対象外
	if (event.pointerType === 'mouse') return;
	toggleScrollLockOnPointerEnd();
}

/**
 * emit(refresh)が完了したことを知らせる関数
 *
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
function refreshFinished() {
	closeContent().then(() => {
		isPulling.value = false;
		isRefreshing.value = false;
	});
}

onMounted(() => {
	if (rootEl.value == null) return;
	scrollEl = getScrollContainer(rootEl.value);
	lockDownScroll();
	rootEl.value.addEventListener('pointerdown', moveStartByPointer, { passive: false }); // preventDefaultする可能性があるため
	rootEl.value.addEventListener('pointerup', onRootPointerUpOrCancel, { passive: true });
	rootEl.value.addEventListener('pointercancel', onRootPointerUpOrCancel, { passive: true });
});

onUnmounted(() => {
	unlockDownScroll();
	cleanupPullInteraction();
	if (rootEl.value) rootEl.value.removeEventListener('pointerdown', moveStartByPointer);
	if (rootEl.value) rootEl.value.removeEventListener('pointerup', onRootPointerUpOrCancel);
	if (rootEl.value) rootEl.value.removeEventListener('pointercancel', onRootPointerUpOrCancel);
});
</script>

<style lang="scss" module>
.isPulling {
	will-change: contents;
}

.frame {
	position: relative;
	overflow: clip;

	width: 100%;
	min-height: var(--frame-min-height, 0px);

	mask-image: linear-gradient(90deg, #000 0%, #000 80%, transparent);
	-webkit-mask-image: -webkit-linear-gradient(90deg, #000 0%, #000 80%, transparent);

	pointer-events: none;
}

.frameContent {
	position: absolute;
	bottom: 0;
	width: 100%;
	margin: 5px 0;
	display: flex;
	flex-direction: column;
	align-items: center;

	> .icon, > .loader {
		margin: 6px 0;
	}

	> .icon {
		transition: transform .25s;

		&.refresh {
			transform: rotate(180deg);
		}
	}

	> .text {
		margin: 5px 0;
		font-size: 90%;
	}
}
</style>
