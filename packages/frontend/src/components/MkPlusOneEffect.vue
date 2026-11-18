<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ zIndex, top: `${y - 64}px`, left: `${x - 64}px` }">
	<span ref="textEl" class="text">+{{ value }}</span>
</div>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import * as os from '@/os.js';

const props = withDefaults(defineProps<{
	x: number;
	y: number;
	value?: number | string;
}>(), {
	value: 1,
});

const emit = defineEmits<{
	(ev: 'end'): void;
}>();

const textEl = useTemplateRef('textEl');
const zIndex = os.claimZIndex('middle');
const angle = (45 - (Math.random() * 90)) + 'deg';

onMounted(() => {
	if (textEl.value == null) {
		emit('end');
		return;
	}

	const end = () => emit('end');
	Promise.all([
		textEl.value.animate({
			transform: ['translateY(0px)', `translateY(-50px) rotateZ(${angle})`],
		}, {
			duration: 1000,
			easing: 'cubic-bezier(0,.5,0,1)',
			fill: 'forwards',
		}).finished,
		textEl.value.animate({
			opacity: [1, 0],
		}, {
			duration: 1000,
			easing: 'cubic-bezier(.5,0,1,.5)',
			fill: 'forwards',
		}).finished,
	]).then(end, end);
});
</script>

<style lang="scss" module>
.root {
	user-select: none;
	pointer-events: none;
	position: fixed;
	width: 128px;
	height: 128px;

	&:global {
		> .text {
			display: block;
			height: 1em;
			text-align: center;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			color: #fff;
			text-shadow: 0 0 6px #000;
			font-size: 18px;
			font-weight: bold;
			will-change: opacity, transform;
		}
	}
}
</style>
