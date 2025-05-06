<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<svg v-if="type === 'info'" :class="[$style.icon, $style.info]" viewBox="0 0 128 128">
	<path d="M64,92L64,56" style="--l:40;" :class="[$style.line, $style.anim]"/>
	<circle cx="64" cy="36" r="4" :class="[$style.fill]"/>
	<circle cx="64" cy="64" r="56" style="--l:400;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'question'" :class="[$style.icon, $style.question]" viewBox="0 0 128 128">
	<path d="M63.991,76L64,68C73.333,68 80,60.333 80,52C80,43.667 73.336,36 64,36C54.664,36 47.983,43.664 47.983,52" style="--l:85;" :class="[$style.line, $style.anim]"/>
	<circle cx="64" cy="92" r="4" :class="[$style.fill]"/>
	<circle cx="64" cy="64" r="56" style="--l:400;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'error'" :class="[$style.icon, $style.error]" viewBox="0 0 128 128">
	<path d="M47.029,47.029L80.971,80.971" style="--l:55;--duration:0.3s;" :class="[$style.line, $style.anim]"/>
	<path d="M80.971,47.029L47.029,80.971" style="--l:55;--duration:0.3s;--delay:0.2s;" :class="[$style.line, $style.anim]"/>
	<circle cx="64" cy="64" r="56" style="--l:400;" :class="[$style.line, $style.anim]"/>
</svg>
</template>

<script lang="ts" setup>
import {} from 'vue';

const props = defineProps<{
	type: 'info' | 'question' | 'warn' | 'error';
}>();
</script>

<style lang="scss" module>
.icon {
	color: var(--MI_THEME-accent);
	stroke-linecap: round;
	stroke-linejoin: round;

	&.question {
		color: var(--MI_THEME-warn);
	}

	&.warn {
		color: var(--MI_THEME-warn);
	}

	&.error {
		color: var(--MI_THEME-error);
	}
}

.line {
	fill: none;
	stroke: currentColor;
	stroke-width: 8px;
}

.fill {
	fill: currentColor;
}

.anim {
	stroke-dasharray: var(--l);
	stroke-dashoffset: var(--l);
	animation: line-animation var(--duration, 0.5s) ease-out 1 forwards;
	animation-delay: var(--delay, 0s);
}

@keyframes line-animation {
	0% {
		stroke-dashoffset: var(--l);
	}
	100% {
		stroke-dashoffset: 0;
	}
}
</style>
