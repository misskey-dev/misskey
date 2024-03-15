<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span>{{ number(Math.floor(tweened.number)) }}</span>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import number from '@/filters/number.js';

const props = defineProps<{
	value: number;
}>();

const tweened = reactive({
	number: 0,
});

watch(() => props.value, (to, from) => {
	// requestAnimationFrameを利用して、500msでfromからtoまでを1次関数的に変化させる
	let start: number | null = null;

	function step(timestamp: number) {
		if (start === null) {
			start = timestamp;
		}
		const elapsed = timestamp - start;
		tweened.number = (from ?? 0) + (to - (from ?? 0)) * elapsed / 500;
		if (elapsed < 500) {
			window.requestAnimationFrame(step);
		} else {
			tweened.number = to;
		}
	}

	window.requestAnimationFrame(step);
}, {
	immediate: true,
});
</script>
