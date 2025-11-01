<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrap">
	<span
		ref="contentEl"
		:class="[$style.content, {
			[$style.paused]: paused,
			[$style.reverse]: reverse,
		}]"
	>
		<span v-for="key in repeat" :key="key" :class="$style.text">
			<slot></slot>
		</span>
	</span>
</div>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef, watch } from 'vue';

const props = withDefaults(defineProps<{
	duration?: number;
	repeat?: number;
	paused?: boolean;
	reverse?: boolean;
}>(), {
	duration: 15,
	repeat: 2,
	paused: false,
	reverse: false,
});

const contentEl = useTemplateRef('contentEl');

function calcDuration() {
	if (contentEl.value == null) return;
	const eachLength = contentEl.value.offsetWidth / props.repeat;
	const factor = 3000;
	const duration = props.duration / ((1 / eachLength) * factor);
	contentEl.value.style.animationDuration = `${duration}s`;
}

watch(() => props.duration, calcDuration);

onMounted(calcDuration);
</script>

<style lang="scss" module>
.wrap {
	overflow: clip;
	animation-play-state: running;

	&:hover {
		animation-play-state: paused;
	}
}

.content {
	display: inline-block;
	white-space: nowrap;
	animation-play-state: inherit;
}

.text {
	display: inline-block;
	animation-name: marquee;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
	animation-duration: inherit;
	animation-play-state: inherit;
}

.paused .text {
	animation-play-state: paused;
}

.reverse .text {
	animation-direction: reverse;
}

@keyframes marquee {
	0% { transform: translateX(0); }
	100% { transform: translateX(-100%); }
}
</style>
