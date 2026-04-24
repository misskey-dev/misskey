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
import { ref, useTemplateRef, computed, nextTick, watch } from 'vue';
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

// ▲ しきい値 ▲ //

let startScreenX: number | null = null;
let startScreenY: number | null = null;

const currentTabIndex = computed(() => props.tabs.findIndex(tab => tab.key === tabModel.value));

const pullDistance = ref(0);
const isSwipingForClass = ref(false);
let swipeAborted = false;
let swipeDirectionLocked: 'horizontal' | 'vertical' | null = null;

function touchStart(event: TouchEvent) {
	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	startScreenX = event.touches[0].screenX;
	startScreenY = event.touches[0].screenY;
	swipeDirectionLocked = null; // スワイプ方向をリセット
}

function touchMove(event: TouchEvent) {
	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (startScreenX == null || startScreenY == null) return;

	if (swipeAborted) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	let distanceX = event.touches[0].screenX - startScreenX;
	let distanceY = event.touches[0].screenY - startScreenY;

	// スワイプ方向をロック
	if (!swipeDirectionLocked) {
		const angle = Math.abs(Math.atan2(distanceY, distanceX) * (180 / Math.PI));
		if (angle > 90 - SWIPE_DIRECTION_ANGLE_THRESHOLD && angle < 90 + SWIPE_DIRECTION_ANGLE_THRESHOLD) {
			swipeDirectionLocked = 'vertical';
		} else {
			swipeDirectionLocked = 'horizontal';
		}
	}

	// 縦方向のスワイプの場合は中断
	if (swipeDirectionLocked === 'vertical') {
		swipeAborted = true;
		pullDistance.value = 0;
		isSwiping.value = false;
		window.setTimeout(() => {
			isSwipingForClass.value = false;
		}, 400);
		return;
	}

	if (Math.abs(distanceX) < MIN_SWIPE_DISTANCE) return;
	if (Math.abs(distanceX) > MAX_SWIPE_DISTANCE) return;

	if (currentTabIndex.value === 0 || props.tabs[currentTabIndex.value - 1].onClick) {
		distanceX = Math.min(distanceX, 0);
	}
	if (currentTabIndex.value === props.tabs.length - 1 || props.tabs[currentTabIndex.value + 1].onClick) {
		distanceX = Math.max(distanceX, 0);
	}
	if (distanceX === 0) return;

	isSwiping.value = true;
	isSwipingForClass.value = true;
	nextTick(() => {
		// グリッチを控えるため、1.5px以上の差がないと更新しない
		if (Math.abs(distanceX - pullDistance.value) < 1.5) return;
		pullDistance.value = distanceX;
	});
}

function touchEnd(event: TouchEvent) {
	if (swipeAborted) {
		swipeAborted = false;
		return;
	}

	if (!prefer.r.enableHorizontalSwipe.value) return;

	if (event.touches.length !== 0) return;

	if (startScreenX == null) return;

	if (!isSwiping.value) return;

	if (hasSomethingToDoWithXSwipe(event.target as HTMLElement)) return;

	const distance = event.changedTouches[0].screenX - startScreenX;

	if (Math.abs(distance) > SWIPE_DISTANCE_THRESHOLD) {
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

	pullDistance.value = 0;
	isSwiping.value = false;
	window.setTimeout(() => {
		isSwipingForClass.value = false;
	}, 400);

	swipeDirectionLocked = null; // スワイプ方向をリセット
}

/** 横スワイプに関与する可能性のある要素を調べる */
function hasSomethingToDoWithXSwipe(el: HTMLElement) {
	if (['INPUT', 'TEXTAREA'].includes(el.tagName)) return true;
	if (el.isContentEditable) return true;
	if (el.scrollWidth > el.clientWidth) return true;

	const style = window.getComputedStyle(el);
	if (['absolute', 'fixed', 'sticky'].includes(style.position)) return true;
	if (['scroll', 'auto'].includes(style.overflowX)) return true;
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
	transition: transform .2s ease-out;
}
</style>
