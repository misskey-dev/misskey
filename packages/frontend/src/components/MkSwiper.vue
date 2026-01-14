<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[$style.transitionRoot, { [$style.enableAnimation]: shouldAnimate }]"
	@touchstart.passive="touchStart"
	@touchmove.passive="touchMove"
	@touchend.passive="touchEnd"
	@touchcancel.passive="touchCancel"
>
	<Transition
		:class="[$style.transitionChildren, { [$style.swiping]: isSwipingForClass }]"
		:enterActiveClass="$style.swipeAnimation_enterActive"
		:leaveActiveClass="$style.swipeAnimation_leaveActive"
		:enterFromClass="transitionName === 'swipeAnimationLeft' ? $style.swipeAnimationLeft_enterFrom : $style.swipeAnimationRight_enterFrom"
		:leaveToClass="transitionName === 'swipeAnimationLeft' ? $style.swipeAnimationLeft_leaveTo : $style.swipeAnimationRight_leaveTo"
		:style="`--swipe: ${pullDistance}px;`"
	>
		<div :key="tabModel">
			<slot></slot>
		</div>
	</Transition>
</div>
</template>
<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch } from 'vue';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import { isHorizontalSwipeSwiping as isSwiping } from '@/utility/touch.js';
import { prefer } from '@/preferences.js';

const rootEl = useTemplateRef('rootEl');

const tabModel = defineModel<string>('tab');

const props = defineProps<{
	tabs: Tab[];
}>();

const emit = defineEmits<{
	(ev: 'swiped', newKey: string, direction: 'left' | 'right'): void;
}>();

const shouldAnimate = computed(() => prefer.r.enableHorizontalSwipe.value || prefer.r.animation.value);

// ▼ しきい値 ▼ //

// スワイプと判定される最小の距離
const MIN_SWIPE_DISTANCE = 20;

// スワイプ時の動作を発火する最小の距離
const SWIPE_DISTANCE_THRESHOLD = 70;

// スワイプできる最大の距離
const MAX_SWIPE_DISTANCE = 120;

// スワイプ方向を判定する角度の許容範囲（度数）
const SWIPE_DIRECTION_ANGLE_THRESHOLD = 50;

// 指を離したときに元に戻すアニメーションの時間
const RELEASE_TRANSITION_DURATION = 200;

// スワイプ方向ロック判定を始める最小移動量（小さすぎると誤判定しやすい）
const DIRECTION_LOCK_START_DISTANCE = 6;

// ▲ しきい値 ▲ //

let startScreenX: number | null = null;
let startScreenY: number | null = null;

let isTracking = false;
let rafId: number | null = null;
let pendingPullDistance: number | null = null;
let releaseAnimationCancel: (() => void) | null = null;

const currentTabIndex = computed(() => props.tabs.findIndex(tab => tab.key === tabModel.value));

const pullDistance = ref(0);
const isSwipingForClass = ref(false);
let swipeAborted = false;
let swipeDirectionLocked: 'horizontal' | 'vertical' | null = null;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function toEffectiveDistance(rawDistance: number): number {
	const sign = Math.sign(rawDistance);
	const abs = Math.abs(rawDistance);
	if (abs <= MIN_SWIPE_DISTANCE) return 0;
	return sign * (abs - MIN_SWIPE_DISTANCE);
}

function setPullDistanceDirect(nextDistance: number) {
	pendingPullDistance = nextDistance;
	if (rafId != null) return;
	rafId = window.requestAnimationFrame(() => {
		rafId = null;
		const next = pendingPullDistance ?? 0;
		pendingPullDistance = null;
		// グリッチ抑制: 0.5px未満の更新は捨てる
		if (Math.abs(next - pullDistance.value) < 0.5) return;
		pullDistance.value = next;
	});
}

function cancelReleaseAnimation() {
	if (releaseAnimationCancel) {
		releaseAnimationCancel();
		releaseAnimationCancel = null;
	}
}

function animatePullDistanceTo(to: number, duration = RELEASE_TRANSITION_DURATION): Promise<void> {
	cancelReleaseAnimation();

	if (!shouldAnimate.value || duration <= 0) {
		setPullDistanceDirect(to);
		return Promise.resolve();
	}

	return new Promise(resolve => {
		const from = pullDistance.value;
		const delta = to - from;
		if (Math.abs(delta) < 0.5) {
			setPullDistanceDirect(to);
			resolve();
			return;
		}

		const startTime = performance.now();
		let cancelled = false;
		releaseAnimationCancel = () => {
			cancelled = true;
		};

		const tick = (now: number) => {
			if (cancelled) {
				resolve();
				return;
			}
			const t = Math.min((now - startTime) / duration, 1);
			// リリース時は軽くイージング（追従中は直接反映）
			const eased = 1 - Math.pow(1 - t, 3);
			setPullDistanceDirect(from + delta * eased);
			if (t >= 1) {
				releaseAnimationCancel = null;
				resolve();
				return;
			}
			window.requestAnimationFrame(tick);
		};
		window.requestAnimationFrame(tick);
	});
}

function resetSwipeState() {
	startScreenX = null;
	startScreenY = null;
	isTracking = false;
	swipeDirectionLocked = null;
	isSwiping.value = false;
}

function touchStart(event: TouchEvent) {
	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	cancelReleaseAnimation();

	startScreenX = event.touches[0].screenX;
	startScreenY = event.touches[0].screenY;
	isTracking = true;
	swipeDirectionLocked = null; // スワイプ方向をリセット
	swipeAborted = false;
}

function touchMove(event: TouchEvent) {
	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (startScreenX == null || startScreenY == null) return;
	if (!isTracking) return;

	if (swipeAborted) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	const rawDistanceX = event.touches[0].screenX - startScreenX;
	const rawDistanceY = event.touches[0].screenY - startScreenY;

	// スワイプ方向をロック
	if (!swipeDirectionLocked) {
		const moveDistance = Math.hypot(rawDistanceX, rawDistanceY);
		if (moveDistance >= DIRECTION_LOCK_START_DISTANCE) {
			const angle = Math.abs(Math.atan2(rawDistanceY, rawDistanceX) * (180 / Math.PI));
			if (angle > 90 - SWIPE_DIRECTION_ANGLE_THRESHOLD && angle < 90 + SWIPE_DIRECTION_ANGLE_THRESHOLD) {
				swipeDirectionLocked = 'vertical';
			} else {
				swipeDirectionLocked = 'horizontal';
			}
		}
	}

	// 縦方向のスワイプの場合は中断
	if (swipeDirectionLocked === 'vertical') {
		swipeAborted = true;
		setPullDistanceDirect(0);
		resetSwipeState();
		// クラスは即座に落とす（縦スクロールを邪魔しない）
		isSwipingForClass.value = false;
		return;
	}

	if (Math.abs(rawDistanceX) < MIN_SWIPE_DISTANCE) return;

	let distanceX = clamp(toEffectiveDistance(rawDistanceX), -MAX_SWIPE_DISTANCE, MAX_SWIPE_DISTANCE);

	if (currentTabIndex.value === 0 || props.tabs[currentTabIndex.value - 1].onClick) {
		distanceX = Math.min(distanceX, 0);
	}
	if (currentTabIndex.value === props.tabs.length - 1 || props.tabs[currentTabIndex.value + 1].onClick) {
		distanceX = Math.max(distanceX, 0);
	}
	if (distanceX === 0) return;

	isSwiping.value = true;
	isSwipingForClass.value = true;
	setPullDistanceDirect(distanceX);
}

function touchEnd(event: TouchEvent) {
	if (swipeAborted) {
		swipeAborted = false;
		resetSwipeState();
		return;
	}

	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 0) return;

	if (startScreenX == null) return;
	if (!isTracking) return;

	if (!isSwiping.value) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	const distance = event.changedTouches[0].screenX - startScreenX;
	const effectiveDistance = toEffectiveDistance(distance);
	const effectiveThreshold = Math.max(SWIPE_DISTANCE_THRESHOLD - MIN_SWIPE_DISTANCE, 0);

	if (Math.abs(effectiveDistance) > effectiveThreshold) {
		if (distance > 0) {
			if (props.tabs[currentTabIndex.value - 1] && !props.tabs[currentTabIndex.value - 1].onClick) {
				tabModel.value = props.tabs[currentTabIndex.value - 1].key;
				emit('swiped', props.tabs[currentTabIndex.value - 1].key, 'right');
			}
		} else {
			if (props.tabs[currentTabIndex.value + 1] && !props.tabs[currentTabIndex.value + 1].onClick) {
				tabModel.value = props.tabs[currentTabIndex.value + 1].key;
				emit('swiped', props.tabs[currentTabIndex.value + 1].key, 'left');
			}
		}
	}

	resetSwipeState();
	animatePullDistanceTo(0).finally(() => {
		isSwipingForClass.value = false;
	});
}

function touchCancel(_event: TouchEvent) {
	swipeAborted = false;
	resetSwipeState();
	animatePullDistanceTo(0).finally(() => {
		isSwipingForClass.value = false;
	});
}

/** 横スワイプに関与する可能性のある要素を調べる */
function hasSomethingToDoWithXSwipe(el: HTMLElement) {
	if (['INPUT', 'TEXTAREA'].includes(el.tagName)) return true;
	if (el.isContentEditable) return true;
	if (el.scrollWidth > el.clientWidth) return true;

	const style = window.getComputedStyle(el);
	if (['absolute', 'fixed', 'sticky'].includes(style.position)) return true;
	if (style.overflowX === 'scroll') return true;
	if (style.touchAction === 'pan-x') return true;

	if (el.parentElement && el.parentElement !== rootEl.value) {
		return hasSomethingToDoWithXSwipe(el.parentElement);
	} else {
		return false;
	}
}

const transitionName = ref<'swipeAnimationLeft' | 'swipeAnimationRight' | undefined>(undefined);

watch(tabModel, (newTab, oldTab) => {
	const newIndex = props.tabs.findIndex(tab => tab.key === newTab);
	const oldIndex = props.tabs.findIndex(tab => tab.key === oldTab);

	if (oldIndex >= 0 && newIndex >= 0 && oldIndex < newIndex) {
		transitionName.value = 'swipeAnimationLeft';
	} else {
		transitionName.value = 'swipeAnimationRight';
	}

	window.setTimeout(() => {
		transitionName.value = undefined;
	}, 400);
});
</script>

<style lang="scss" module>
.transitionRoot {
	touch-action: pan-y pinch-zoom;
	display: grid;
	grid-template-columns: 100%;
	overflow: clip;
}

.transitionChildren {
	grid-area: 1 / 1 / 2 / 2;
	transform: translateX(var(--swipe));
}

.enableAnimation .transitionChildren {
	&.swipeAnimation_enterActive,
	&.swipeAnimation_leaveActive {
		transition: transform .3s cubic-bezier(0.65, 0.05, 0.36, 1);
	}

	&.swipeAnimationRight_leaveTo,
	&.swipeAnimationLeft_enterFrom {
		transform: translateX(calc(100% + 24px));
	}

	&.swipeAnimationRight_enterFrom,
	&.swipeAnimationLeft_leaveTo {
		transform: translateX(calc(-100% - 24px));
	}
}

.swiping {
	transition: none;
}
</style>
