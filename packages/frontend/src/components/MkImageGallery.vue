<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{ zIndex }">
	<div :class="[$style.bg]"></div>
	<div ref="mainEl" :class="$style.main">
		<div ref="itemsEl" :class="$style.items" :style="{ left: `${imagesOffset}px` }">
			<div v-for="(image, i) in images" :key="image.url" ref="itemEl" :class="$style.item">
				<XItem
					:image="image"
					:activated="activatedIndexes.has(i)"
					@close="onItemClose"
					@horizontalSwipe="onHorizontalSwipe"
					@prev="onPrev"
					@next="onNext"
					@cancelHorizontalSwipe="onCancelHorizontalSwipe"
				/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import XItem from './MkImageGallery.item.vue';
import type { Image } from './MkImageGallery.item.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { beginAnimation, easing_easeInOutQuad } from '@/utility/animation.js';

const props = withDefaults(defineProps<{
	defaultIndex?: number;
	images: Image[];
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

const zIndex = os.claimZIndex('high');
const screenWidth = ref(window.innerWidth);
const imagesOffset = ref(currentIndex.value * -window.innerWidth);
let currentScrollLeft = imagesOffset.value;

function onHorizontalSwipe(offset: number) {
	imagesOffset.value = currentScrollLeft + offset;
}

function scrollToCurrentIndex() {
	currentScrollLeft = currentIndex.value * -screenWidth.value;
	beginAnimation({
		from: { value: imagesOffset.value },
		to: { value: currentIndex.value * -screenWidth.value },
		duration: 300,
		easing: easing_easeInOutQuad,
		apply: ({ value }) => {
			imagesOffset.value = value;
		},
	});
}

function onCancelHorizontalSwipe() {
	scrollToCurrentIndex();
}

function onNext() {
	if (currentIndex.value < props.images.length - 1) {
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
	emit('closed');
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.bg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: #0008;
}

.main {
	position: absolute;

}

.items {
	position: absolute;
	display: flex;
	width: calc(v-bind("screenWidth + 'px'") * v-bind("images.length"));
	height: 100dvh;
	overflow: clip;
	contain: strict;
}

.item {
	width: 100dvw;
	height: 100dvh;
	overflow: clip;
	contain: strict;
	flex-shrink: 0;
}
</style>
