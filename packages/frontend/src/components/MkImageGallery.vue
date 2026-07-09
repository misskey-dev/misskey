<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{ zIndex }">
	<div :class="[$style.bg]"></div>
	<div ref="mainEl" :class="$style.main">
		<div ref="itemsEl" :class="$style.items">
			<div v-for="image in images" :key="image.src" ref="itemEl" :class="$style.item">
				<XItem
					:image="image"
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
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import XItem from './MkImageGallery.item.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

type Image = {
	id: string;
	src: string;
	width: number;
	height: number;
	sourceElement?: HTMLElement;
};

const props = withDefaults(defineProps<{
	defaultIndex?: number;
	images: Image[];
}>(), {
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const rootEl = useTemplateRef('rootEl');
const mainEl = useTemplateRef('mainEl');
const itemsEl = useTemplateRef('itemsEl');
const itemEl = useTemplateRef('itemEl');
const zIndex = os.claimZIndex('high');

let currentScrollLeft = 0;
let currentIndex = props.defaultIndex ?? 0;

function onHorizontalSwipe(offset: number) {
	itemsEl.value.scrollLeft = currentScrollLeft + offset;
}

function onCancelHorizontalSwipe() {
	itemsEl.value.scrollTo({
		left: currentScrollLeft,
		behavior: 'smooth',
	});
}

function onNext() {
	if (currentIndex < props.images.length - 1) {
		currentIndex++;
		const el = itemEl.value[currentIndex];
		currentScrollLeft = el.offsetLeft;
		itemsEl.value.scrollTo({
			left: currentScrollLeft,
			behavior: 'smooth',
		});
	}
}

function onPrev() {
	if (currentIndex > 0) {
		currentIndex--;
		const el = itemEl.value[currentIndex];
		currentScrollLeft = el.offsetLeft;
		itemsEl.value.scrollTo({
			left: currentScrollLeft,
			behavior: 'smooth',
		});
	}
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
	display: flex;
	width: 100dvw;
	height: 100dvh;
	overflow: hidden;
	scrollbar-width: none;
}

.item {
	width: 100dvw;
	height: 100dvh;
	overflow: clip;
	contain: strict;
	flex-shrink: 0;
}
</style>
