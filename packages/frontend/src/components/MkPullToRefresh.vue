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

function getScreenY(event: TouchEvent | MouseEvent | PointerEvent): number {
	if (('touches' in event) && event.touches[0] && event.touches[0].screenY != null) {
		return event.touches[0].screenY;
	} else if ('screenY' in event) {
		return event.screenY;
	} else {
		return 0; // TSを黙らせるため
	}
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

function moveStartByMouse(event: MouseEvent) {
	if (event.button !== 1) return;
	if (isRefreshing.value) return;

	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos !== 0) {
		unlockDownScroll();
		return;
	}

	lockDownScroll();

	event.preventDefault(); // 中クリックによるスクロール、テキスト選択などを防ぐ

	isPulling.value = true;
	startScreenY = getScreenY(event);
	pullDistance.value = 0;

	window.addEventListener('mousemove', moving, { passive: true });
	window.addEventListener('mouseup', () => {
		window.removeEventListener('mousemove', moving);
		onPullRelease();
	}, { passive: true, once: true });
}

function moveStartByTouch(event: TouchEvent) {
	if (isRefreshing.value) return;

	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos !== 0) {
		unlockDownScroll();
		return;
	}

	lockDownScroll();

	isPulling.value = true;
	startScreenY = getScreenY(event);
	pullDistance.value = 0;

	window.addEventListener('touchmove', moving, { passive: true });
	window.addEventListener('touchend', () => {
		window.removeEventListener('touchmove', moving);
		onPullRelease();
	}, { passive: true, once: true });
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
	startScreenY = null;
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

function toggleScrollLockOnTouchEnd() {
	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos === 0) {
		lockDownScroll();
	} else {
		unlockDownScroll();
	}
}

function moving(event: MouseEvent | TouchEvent) {
	if ((scrollEl?.scrollTop ?? 0) > SCROLL_STOP + pullDistance.value || isHorizontalSwipeSwiping.value) {
		pullDistance.value = 0;
		isPulledEnough.value = false;
		onPullRelease();
		return;
	}

	if (startScreenY === null) {
		startScreenY = getScreenY(event);
	}
	const moveScreenY = getScreenY(event);

	const moveHeight = moveScreenY - startScreenY!;
	pullDistance.value = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);

	isPulledEnough.value = pullDistance.value >= FIRE_THRESHOLD;

	if (isPulledEnough.value) haptic();
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
	rootEl.value.addEventListener('mousedown', moveStartByMouse, { passive: false }); // preventDefaultするため
	rootEl.value.addEventListener('touchstart', moveStartByTouch, { passive: true });
	rootEl.value.addEventListener('touchend', toggleScrollLockOnTouchEnd, { passive: true });
});

onUnmounted(() => {
	unlockDownScroll();
	if (rootEl.value) rootEl.value.removeEventListener('mousedown', moveStartByMouse);
	if (rootEl.value) rootEl.value.removeEventListener('touchstart', moveStartByTouch);
	if (rootEl.value) rootEl.value.removeEventListener('touchend', toggleScrollLockOnTouchEnd);
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
