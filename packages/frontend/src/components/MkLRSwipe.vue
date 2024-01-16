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

const MIN_SWIPE_DISTANCE = 50;
const SWIPE_DISTANCE_THRESHOLD = 150;
const MAX_SWIPE_DISTANCE = 200;

let startScreenX: number | null = null;

const currentTabIndex = computed(() => props.tabs.findIndex(tab => tab.key === props.tab));

const pullDistance = ref(0);
const isSwiping = ref(false);
const isSwipingForClass = ref(false);

function touchStart(event: TouchEvent) {
	if (!defaultStore.reactiveState.enableXSwipe.value) return;

	if (event.touches.length !== 1) return;

	startScreenX = event.touches[0].screenX;
}

function touchMove(event: TouchEvent) {
	if (!defaultStore.reactiveState.enableXSwipe.value) return;

	if (event.touches.length !== 1) return;

	if (startScreenX == null) return;

	let distance = event.touches[0].screenX - startScreenX;

	if (Math.abs(distance) < MIN_SWIPE_DISTANCE) return;
	if (Math.abs(distance) > MAX_SWIPE_DISTANCE) return;

	if (currentTabIndex.value === 0 || props.tabs[currentTabIndex.value - 1].onClick) {
		distance = Math.min(distance, 0);
	}
	if (currentTabIndex.value === props.tabs.length - 1 || props.tabs[currentTabIndex.value + 1].onClick) {
		distance = Math.max(distance, 0);
	}
	if (distance === 0) return;

	isSwiping.value = true;
	isSwipingForClass.value = true;
	nextTick(() => {
		// グリッチを控えるため、1.5px以上の差がないと更新しない
		if (Math.abs(distance - pullDistance.value) < 1.5) return;
		pullDistance.value = distance;
	});
}

function touchEnd(event: TouchEvent) {
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
