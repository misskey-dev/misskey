<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- durationは子Itemコンポーネントがフェードイン/アウトするdurationと合わせる -->
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_root_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_root_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_root_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_root_leaveTo : ''"
	:duration="{ enter: prefer.s.animation ? openAnimDuration : 0, leave: prefer.s.animation ? closeAnimDuration : 0 }"
	appear
	@afterLeave="onAfterLeave"
>
	<!-- v-ifを使うとfalseになったとき(transitionが行われている間)子コンポーネントの更新が停止するのか子コンポーネントがアニメーションされなくなる -->
	<div v-show="showing" ref="rootEl" v-hotkey.global="keymap" :class="$style.root" :style="{ zIndex }">
		<div :class="[$style.bg]" class="_modalBg"></div>
		<div ref="mainEl" :class="$style.main">
			<div
				ref="itemsEl"
				:class="[$style.items, { [$style.itemsTransition]: enableSlideTransition }]"
				:style="{ translate: `${contentsOffset}px 0` }"
				@transitionend.self="onSlideTransitionFinished"
				@transitioncancel.self="onSlideTransitionFinished"
			>
				<div v-for="(content, i) in contents" :key="content.url" ref="itemEl" :class="$style.item">
					<XItem
						:content="content"
						:activated="activatedIndexes.has(i)"
						@close="onItemClose"
						@horizontalSwipe="onHorizontalSwipe"
						@prev="onPrev"
						@next="onNext"
						@cancelHorizontalSwipe="onCancelHorizontalSwipe"
					/>
				</div>
			</div>

			<button v-if="!isTouchUsing && currentIndex > 0" class="_button" :class="[$style.prevButton]" @click="onPrev"><div :class="$style.buttonIcon"><i class="ti ti-arrow-left"></i></div></button>
			<button v-if="!isTouchUsing && currentIndex < contents.length - 1" class="_button" :class="[$style.nextButton]" @click="onNext"><div :class="$style.buttonIcon"><i class="ti ti-arrow-right"></i></div></button>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import XItem from './MkImageGallery.item.vue';
import type { Content } from './MkImageGallery.item.vue';
import type { Keymap } from '@/utility/hotkey.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { isTouchUsing } from '@/utility/touch.js';

const props = withDefaults(defineProps<{
	defaultIndex?: number;
	contents: Content[];
}>(), {
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const activatedIndexes = ref(new Set<number>());
const currentIndex = ref(props.defaultIndex ?? 0);
watch(currentIndex, (newIndex) => {
	activatedIndexes.value.add(newIndex);
}, { immediate: true });
watch(currentIndex, (newIndex) => {
	for (let i = 0; i < props.contents.length; i++) {
		const content = props.contents[i];
		if (content.sourceElement != null) {
			content.sourceElement.style.visibility = i === newIndex ? 'hidden' : '';
		}
	}
}, { immediate: false });

const openAnimDuration = 200;
const closeAnimDuration = 200;
const slideAnimDuration = 300;
const zIndex = os.claimZIndex('high');
const showing = ref(true);
const screenWidth = ref(window.innerWidth);
const contentsOffset = ref(currentIndex.value * -window.innerWidth);
const enableSlideTransition = ref(false);
let currentScrollLeft = contentsOffset.value;

// TODO: unmountで解除
window.addEventListener('resize', () => {
	screenWidth.value = window.innerWidth;
	scrollToCurrentIndex();
});

function onHorizontalSwipe(offset: number) {
	if (currentIndex.value === 0 && offset > 0) { // これ以上戻れない
		contentsOffset.value = currentScrollLeft + (offset / 3);
	} else if (currentIndex.value === props.contents.length - 1 && offset < 0) { // これ以上進めない
		contentsOffset.value = currentScrollLeft + (offset / 3);
	} else {
		contentsOffset.value = currentScrollLeft + offset;
	}
}

function scrollToCurrentIndex() {
	const targetOffset = currentIndex.value * -screenWidth.value;
	currentScrollLeft = targetOffset;

	if (!prefer.s.animation || contentsOffset.value === targetOffset) {
		enableSlideTransition.value = false;
		contentsOffset.value = targetOffset;
		return;
	}

	enableSlideTransition.value = true;
	contentsOffset.value = targetOffset;
}

function onSlideTransitionFinished(ev: TransitionEvent) {
	if (ev.propertyName !== 'translate') return;
	enableSlideTransition.value = false;
}

function onCancelHorizontalSwipe() {
	scrollToCurrentIndex();
}

function onNext() {
	if (currentIndex.value < props.contents.length - 1) {
		currentIndex.value++;
	}
	scrollToCurrentIndex();
}

function onPrev() {
	if (currentIndex.value > 0) {
		currentIndex.value--;
	}
	scrollToCurrentIndex();
}

function onItemClose() {
	showing.value = false;
}

function onAfterLeave() {
	for (const content of props.contents) {
		if (content.sourceElement != null) {
			content.sourceElement.style.visibility = '';
		}
	}
	emit('closed');
}

const keymap = {
	'esc': {
		allowRepeat: true,
		callback: () => onItemClose(),
	},
	'arrowleft': {
		allowRepeat: true,
		callback: () => onPrev(),
	},
	'arrowright': {
		allowRepeat: true,
		callback: () => onNext(),
	},
} as const satisfies Keymap;
</script>

<style lang="scss" module>
.transition_root_enterActive,
.transition_root_leaveActive {
	> .bg {
		transition: opacity v-bind("closeAnimDuration + 'ms'"); // 子Itemコンポーネントがフェードイン/アウトするdurationと合わせる
	}
}
.transition_root_enterFrom,
.transition_root_leaveTo {
	pointer-events: none;
	> .bg {
		opacity: 0;
	}
}

.root {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.bg {
}

.main {
	position: absolute;
	width: 100%;
	height: 100%;
}

.items {
	position: absolute;
	display: flex;
	width: calc(v-bind("screenWidth + 'px'") * v-bind("contents.length"));
	height: 100dvh;
	overflow: clip;
	contain: strict;
}

.itemsTransition {
	pointer-events: none;
	transition: translate v-bind("slideAnimDuration + 'ms'") cubic-bezier(0.45, 0, 0.55, 1);
}

.item {
	width: 100dvw;
	height: 100dvh;
	overflow: clip;
	contain: strict;
	flex-shrink: 0;
}

.prevButton,
.nextButton {
	position: absolute;
	top: 0;
	width: 70px;
	height: 100%;
	display: grid;
	place-items: center;
}
.prevButton {
	left: 0;
}
.nextButton {
	right: 0;
}

.buttonIcon {
	width: 45px;
	height: 45px;
	display: grid;
	place-items: center;
	background-color: rgba(0, 0, 0, 0.3);
	border-radius: 100%;
	color: #fff;
}
</style>
