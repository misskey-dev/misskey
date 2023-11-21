<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
import MkLoading from '@/components/global/MkLoading.vue';
import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { i18n } from '@/i18n.js';
import { getScrollContainer } from '@/scripts/scroll.js';

const SCROLL_STOP = 10;
const MAX_PULL_DISTANCE = Infinity;
const FIRE_THRESHOLD = 230;
const FIRE_THRESHOLD_RATIO = 1.1;
const RELEASE_TRANSITION_DURATION = 200;
const PULL_BRAKE_BASE = 1.5;
const PULL_BRAKE_FACTOR = 170;

let isPullStart = $ref(false);
let isPullEnd = $ref(false);
let isRefreshing = $ref(false);
let pullDistance = $ref(0);
let moveRatio = $ref(0);

let supportPointerDesktop = false;
let startScreenY: number | null = null;
let startClientX: number | null = null;

const rootEl = $shallowRef<HTMLDivElement>();
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

function getClientX(event) {
	if (supportPointerDesktop) {
		return event.clientX;
	}
	return event.touches[0].clientX;
}

function moveStart(event) {
	if (!isPullStart && !isRefreshing && !disabled && scrollEl?.scrollTop === 0) {
		isPullStart = true;
		startScreenY = getScreenY(event);
		startClientX = getClientX(event);
		pullDistance = 0;
		moveRatio = 0;
	}
}

function moveBySystem(to: number): Promise<void> {
	return new Promise(r => {
		const startHeight = pullDistance;
		const overHeight = pullDistance - to;
		if (overHeight < 1) {
			r();
			return;
		}
		const startTime = Date.now();
		let intervalId = setInterval(() => {
			const time = Date.now() - startTime;
			if (time > RELEASE_TRANSITION_DURATION) {
				pullDistance = to;
				clearInterval(intervalId);
				r();
				return;
			}
			const nextHeight = startHeight - (overHeight / RELEASE_TRANSITION_DURATION) * time;
			if (pullDistance < nextHeight) return;
			pullDistance = nextHeight;
		}, 1);
	});
}

async function fixOverContent() {
	if (pullDistance > FIRE_THRESHOLD) {
		await moveBySystem(FIRE_THRESHOLD);
	}
}

async function closeContent() {
	if (pullDistance > 0) {
		await moveBySystem(0);
	}
}

function moveEnd() {
	if (isPullStart && !isRefreshing) {
		startScreenY = null;
		startClientX = null;
		if (isPullEnd) {
			isPullEnd = false;
			isRefreshing = true;
			fixOverContent().then(() => {
				emit('refresh');
				props.refresher().then(() => {
					refreshFinished();
				});
			});
		} else {
			closeContent().then(() => isPullStart = false);
		}
	}
}

function moving(event: TouchEvent | PointerEvent) {
	if (!isPullStart && scrollEl?.scrollTop === 0) moveStart(event);
	if (!isPullStart || isRefreshing || disabled) return;

	if ((scrollEl?.scrollTop ?? 0) > (supportPointerDesktop ? SCROLL_STOP : SCROLL_STOP + pullDistance)) {
		pullDistance = 0;
		isPullEnd = false;
		moveEnd();
		return;
	}

	if (startScreenY === null || startClientX === null) {
		startScreenY = getScreenY(event);
		startClientX = getClientX(event);
	}
	const moveScreenY = getScreenY(event);
	const moveClientX = getClientX(event);

	const moveHeight = moveScreenY - startScreenY!;
	const moveWidth = moveClientX - startClientX!;
	pullDistance = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);
	moveRatio = Math.max(Math.abs(moveHeight), 1) / Math.max(Math.abs(moveWidth), 1);

	if (pullDistance > 0 && moveRatio > FIRE_THRESHOLD_RATIO) {
		if (event.cancelable) event.preventDefault();
	}

	isPullEnd = pullDistance >= FIRE_THRESHOLD && moveRatio > FIRE_THRESHOLD_RATIO;
}

/**
 * emit(refresh)が完了したことを知らせる関数
 *
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
function refreshFinished() {
	closeContent().then(() => {
		isPullStart = false;
		isRefreshing = false;
	});
}

function setDisabled(value) {
	disabled = value;
}

function onScrollContainerScroll() {
	// When at the top of the page, disable vertical overscroll so passive touch listeners can take over.
	if (scrollEl?.scrollTop === 0) {
		scrollEl!.style.touchAction = 'pan-x pan-down pinch-zoom';
	} else {
		scrollEl!.style.touchAction = 'auto';
	}
}

onMounted(() => {
	isRefreshing = false;
	if (rootEl == null) return;
	scrollEl = getScrollContainer(rootEl);
	if (scrollEl == null) return;
	scrollEl.addEventListener('scroll', onScrollContainerScroll, { passive: true });
	rootEl.addEventListener('touchstart', moveStart, { passive: true });
	rootEl.addEventListener('touchmove', moving, { passive: false }); // passive: falseにしないとpreventDefaultが使えない
	rootEl.addEventListener('touchend', moveEnd, { passive: true });
});

onActivated(() => {
	isRefreshing = false;
});

onDeactivated(() => {
	scrollEl!.style.touchAction = 'auto';
	isRefreshing = true;
});

onUnmounted(() => {
	scrollEl!.style.touchAction = 'auto';
	isRefreshing = true;
	if (scrollEl) scrollEl.removeEventListener('scroll', onScrollContainerScroll);
	if (rootEl == null) return;
	rootEl.removeEventListener('touchstart', moveStart);
	rootEl.removeEventListener('touchmove', moving);
	rootEl.removeEventListener('touchend', moveEnd);
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
