<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{ zIndex }">
	<div ref="spotEl" :class="$style.spot"></div>
	<div ref="bodyEl" :class="$style.body" class="_panel _shadow">
		<div class="_gaps_s">
			<div><b>{{ title }}</b></div>
			<div>{{ description }}</div>
			<div class="_buttons">
				<MkButton small @click="prev"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
				<MkButton small primary @click="next">{{ i18n.ts.next }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { calcPopupPosition } from '@/utility/popup-position.js';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	title: string;
	description: string;
	anchorElement?: HTMLElement;
	x?: number;
	y?: number;
	direction?: 'top' | 'bottom' | 'right' | 'left';
}>(), {
	direction: 'top',
});

const emit = defineEmits<{
	(prev: 'prev'): void;
	(next: 'next'): void;
}>();

function prev() {
	emit('prev');
}

function next() {
	emit('next');
}

const rootEl = useTemplateRef('rootEl');
const bodyEl = useTemplateRef('bodyEl');
const spotEl = useTemplateRef('spotEl');
const zIndex = os.claimZIndex('high');
const spotX = ref(0);
const spotY = ref(0);
const spotWidth = ref(0);
const spotHeight = ref(0);

function setPosition() {
	if (spotEl.value == null) return;
	if (bodyEl.value == null) return;
	if (props.anchorElement == null) return;

	const rect = props.anchorElement.getBoundingClientRect();
	spotX.value = rect.left;
	spotY.value = rect.top;
	spotWidth.value = rect.width;
	spotHeight.value = rect.height;

	const data = calcPopupPosition(bodyEl.value, {
		anchorElement: props.anchorElement,
		direction: props.direction,
		align: 'center',
		innerMargin: 16,
		x: props.x,
		y: props.y,
	});

	bodyEl.value.style.transformOrigin = data.transformOrigin;
	bodyEl.value.style.left = data.left + 'px';
	bodyEl.value.style.top = data.top + 'px';
}

let loopHandler;

onMounted(() => {
	nextTick(() => {
		setPosition();

		const loop = () => {
			setPosition();
			loopHandler = window.requestAnimationFrame(loop);
		};

		loop();
	});
});

onUnmounted(() => {
	window.cancelAnimationFrame(loopHandler);
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
	padding: 8px 12px;
	box-sizing: border-box;
	border-radius: 4px;
}

.spot {
	--x: v-bind("spotX + 'px'");
	--y: v-bind("spotY + 'px'");
	--width: v-bind("spotWidth + 'px'");
	--height: v-bind("spotHeight + 'px'");
	--padding: 8px;
	position: absolute;
	left: calc(var(--x) - var(--padding));
	top: calc(var(--y) - var(--padding));
	width: calc(var(--width) + var(--padding) * 2);
	height: calc(var(--height) + var(--padding) * 2);
	border-radius: 8px;
	box-shadow: 0 0 0 9999px #000a;
	transition: left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out;
	animation: blink 1s infinite;
}

.body {
	position: absolute;
	padding: 16px 20px;
	box-sizing: border-box;
	width: max-content;
	max-width: 500px;
}

@keyframes blink {
	0%, 100% {
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.1);
		border: 1px solid color(from var(--MI_THEME-accent) srgb r g b / 0.75);
	}
	50% {
		background: transparent;
		border: 1px solid transparent;
	}
}
</style>
