<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[$style.transitionRoot, (defaultStore.state.animation && $style.enableAnimation)]"
	@touchstart="touchStart"
	@touchmove="touchMove"
	@touchend="touchEnd"
>
	<Transition :name="transitionName" :class="[$style.transitionChildren, { [$style.swiping]: isSwipingForClass }]" :style="`--swipe: ${pullDistance}px;`">
		<!-- 【注意】slot内の最上位要素に動的にkeyを設定すること -->
		<!-- 各最上位要素にユニークなkeyの指定がないとTransitionがうまく動きません -->
		<slot></slot>
	</Transition>
</div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, computed, nextTick, watch } from 'vue';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import { defaultStore } from '@/store.js';

const rootEl = shallowRef<HTMLDivElement>();

const props = defineProps<{
	tab: string;
	tabs: Tab[];
}>();

const emit = defineEmits<{
	(ev: 'swiped', newKey: string, direction: 'left' | 'right'): void;
}>();

// ▼ しきい値 ▼ //

// スワイプと判定される最小の距離
const MIN_SWIPE_DISTANCE = 50;

// スワイプ時の動作を発火する最小の距離
const SWIPE_DISTANCE_THRESHOLD = 150;

// スワイプを中断するY方向の移動距離
const SWIPE_ABORT_Y_THRESHOLD = 50;

// スワイプできる最大の距離
const MAX_SWIPE_DISTANCE = 200;

// ▲ しきい値 ▲ //

let startScreenX: number | null = null;
let startScreenY: number | null = null;

const currentTabIndex = computed(() => props.tabs.findIndex(tab => tab.key === props.tab));

const pullDistance = ref(0);
const isSwiping = ref(false);
const isSwipingForClass = ref(false);
let swipeAborted = false;

function touchStart(event: TouchEvent) {
	if (!defaultStore.reactiveState.enableXSwipe.value) return;

	if (event.touches.length !== 1) return;

	startScreenX = event.touches[0].screenX;
	startScreenY = event.touches[0].screenY;
}

function touchMove(event: TouchEvent) {
	if (!defaultStore.reactiveState.enableXSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (startScreenX == null || startScreenY == null) return;

	if (swipeAborted) return;

	let distanceX = event.touches[0].screenX - startScreenX;
	let distanceY = event.touches[0].screenY - startScreenY;

	if (Math.abs(distanceY) > SWIPE_ABORT_Y_THRESHOLD) {
		swipeAborted = true;

		pullDistance.value = 0;
		isSwiping.value = false;
		setTimeout(() => {
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

	if (!defaultStore.reactiveState.enableXSwipe.value) return;

	if (event.touches.length !== 0) return;

	if (startScreenX == null) return;

	if (!isSwiping.value) return;

	const distance = event.changedTouches[0].screenX - startScreenX;

	if (Math.abs(distance) > SWIPE_DISTANCE_THRESHOLD) {
		if (distance > 0) {
			if (props.tabs[currentTabIndex.value - 1] && !props.tabs[currentTabIndex.value - 1].onClick) {
				emit('swiped', props.tabs[currentTabIndex.value - 1].key, 'right');
			}
			console.log('swiped right');
		} else {
			if (props.tabs[currentTabIndex.value + 1] && !props.tabs[currentTabIndex.value + 1].onClick) {
				emit('swiped', props.tabs[currentTabIndex.value + 1].key, 'left');
			}
			console.log('swiped left');
		}
	}

	pullDistance.value = 0;
	isSwiping.value = false;
	setTimeout(() => {
		isSwipingForClass.value = false;
	}, 400);
}

const transitionName = ref<'swipeAnimationLeft' | 'swipeAnimationRight' | undefined>(undefined);

watch(() => props.tab, (newTab, oldTab) => {
	const newIndex = props.tabs.findIndex(tab => tab.key === newTab);
	const oldIndex = props.tabs.findIndex(tab => tab.key === oldTab);

	if (oldIndex >= 0 && newIndex && oldIndex < newIndex) {
		transitionName.value = 'swipeAnimationLeft';
	} else {
		transitionName.value = 'swipeAnimationRight';
	}

	setTimeout(() => {
		transitionName.value = undefined;
	}, 400);
});
</script>

<style lang="scss" module>
.transitionRoot.enableAnimation {
	display: grid;
	overflow: clip;

	.transitionChildren {
		grid-area: 1 / 1 / 2 / 2;
		transform: translateX(var(--swipe));

		&:global(.swipeAnimationLeft-enter-active),
		&:global(.swipeAnimationRight-enter-active),
		&:global(.swipeAnimationLeft-leave-active),
		&:global(.swipeAnimationRight-leave-active) {
			transition: transform .3s cubic-bezier(0.65, 0.05, 0.36, 1);
		}

		&:global(.swipeAnimationRight-leave-to),
		&:global(.swipeAnimationLeft-enter-from) {
			transform: translateX(calc(100% + 24px));
		}

		&:global(.swipeAnimationRight-enter-from),
		&:global(.swipeAnimationLeft-leave-to) {
			transform: translateX(calc(-100% - 24px));
		}
	}
}

.swiping {
	transition: transform .2s ease-out;
}
</style>
