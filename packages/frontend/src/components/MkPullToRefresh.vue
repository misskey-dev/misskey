<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<div v-if="isPullStart" :class="$style.frame" :style="`--frame-min-height: ${pullDistance / (PULL_BRAKE_BASE + (pullDistance / PULL_BRAKE_FACTOR))}px;`">
		<div :class="$style.frameContent">
			<MkLoading v-if="isRefreshing" :class="$style.loader" :em="true"/>
			<i v-else class="ti ti-arrow-bar-to-down" :class="[$style.icon, { [$style.refresh]: isPullEnd }]"></i>
			<div :class="$style.text">
				<template v-if="isPullEnd">{{ i18n.ts.releaseToRefresh }}</template>
				<template v-else-if="isRefreshing">{{ i18n.ts.refreshing }}</template>
				<template v-else>{{ i18n.ts.pullDownToRefresh }}</template>
			</div>
		</div>
	</div>
	<div :class="{ [$style.slotClip]: isPullStart }">
		<slot/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { i18n } from '@/i18n.js';
import { getScrollContainer } from '@/scripts/scroll.js';
import { isHorizontalSwipeSwiping } from '@/scripts/touch.js';

const SCROLL_STOP = 10;
const MAX_PULL_DISTANCE = Infinity;
const FIRE_THRESHOLD = 230;
const RELEASE_TRANSITION_DURATION = 200;
const PULL_BRAKE_BASE = 1.5;
const PULL_BRAKE_FACTOR = 170;

const isPullStart = ref(false);
const isPullEnd = ref(false);
const isRefreshing = ref(false);
const pullDistance = ref(0);

let supportPointerDesktop = false;
let startScreenY: number | null = null;

const rootEl = shallowRef<HTMLDivElement>();
let scrollEl: HTMLElement | null = null;

let disabled = false;

const props = withDefaults(defineProps<{
	refresher: () => Promise<void>;
}>(), {
	refresher: () => Promise.resolve(),
});

const emit = defineEmits<{
	(ev: 'refresh'): void;
}>();

function getScreenY(event) {
	if (supportPointerDesktop) {
		return event.screenY;
	}
	return event.touches[0].screenY;
}

function moveStart(event) {
	if (!isPullStart.value && !isRefreshing.value && !disabled) {
		isPullStart.value = true;
		startScreenY = getScreenY(event);
		pullDistance.value = 0;
	}
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
		let intervalId = setInterval(() => {
			const time = Date.now() - startTime;
			if (time > RELEASE_TRANSITION_DURATION) {
				pullDistance.value = to;
				clearInterval(intervalId);
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

function moveEnd() {
	if (isPullStart.value && !isRefreshing.value) {
		startScreenY = null;
		if (isPullEnd.value) {
			isPullEnd.value = false;
			isRefreshing.value = true;
			fixOverContent().then(() => {
				emit('refresh');
				props.refresher().then(() => {
					refreshFinished();
				});
			});
		} else {
			closeContent().then(() => isPullStart.value = false);
		}
	}
}

function moving(event: TouchEvent | PointerEvent) {
	if (!isPullStart.value || isRefreshing.value || disabled) return;

	if ((scrollEl?.scrollTop ?? 0) > (supportPointerDesktop ? SCROLL_STOP : SCROLL_STOP + pullDistance.value) || isHorizontalSwipeSwiping.value) {
		pullDistance.value = 0;
		isPullEnd.value = false;
		moveEnd();
		return;
	}

	if (startScreenY === null) {
		startScreenY = getScreenY(event);
	}
	const moveScreenY = getScreenY(event);

	const moveHeight = moveScreenY - startScreenY!;
	pullDistance.value = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);

	if (pullDistance.value > 0) {
		if (event.cancelable) event.preventDefault();
	}

	if (pullDistance.value > SCROLL_STOP) {
		event.stopPropagation();
	}

	isPullEnd.value = pullDistance.value >= FIRE_THRESHOLD;
}

/**
 * emit(refresh)が完了したことを知らせる関数
 *
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
function refreshFinished() {
	closeContent().then(() => {
		isPullStart.value = false;
		isRefreshing.value = false;
	});
}

function setDisabled(value) {
	disabled = value;
}

function onScrollContainerScroll() {
	const scrollPos = scrollEl!.scrollTop;

	// When at the top of the page, disable vertical overscroll so passive touch listeners can take over.
	if (scrollPos === 0) {
		scrollEl!.style.touchAction = 'pan-x pan-down pinch-zoom';
		registerEventListenersForReadyToPull();
	} else {
		scrollEl!.style.touchAction = 'auto';
		unregisterEventListenersForReadyToPull();
	}
}

function registerEventListenersForReadyToPull() {
	if (rootEl.value == null) return;
	rootEl.value.addEventListener('touchstart', moveStart, { passive: true });
	rootEl.value.addEventListener('touchmove', moving, { passive: false }); // passive: falseにしないとpreventDefaultが使えない
}

function unregisterEventListenersForReadyToPull() {
	if (rootEl.value == null) return;
	rootEl.value.removeEventListener('touchstart', moveStart);
	rootEl.value.removeEventListener('touchmove', moving);
}

onMounted(() => {
	if (rootEl.value == null) return;

	scrollEl = getScrollContainer(rootEl.value);
	if (scrollEl == null) return;

	scrollEl.addEventListener('scroll', onScrollContainerScroll, { passive: true });

	rootEl.value.addEventListener('touchend', moveEnd, { passive: true });

	registerEventListenersForReadyToPull();
});

onUnmounted(() => {
	if (scrollEl) scrollEl.removeEventListener('scroll', onScrollContainerScroll);

	unregisterEventListenersForReadyToPull();
});

defineExpose({
	setDisabled,
});
</script>

<style lang="scss" module>
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
	font-size: 14px;

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
	}
}

.slotClip {
	overflow-y: clip;
}
</style>
