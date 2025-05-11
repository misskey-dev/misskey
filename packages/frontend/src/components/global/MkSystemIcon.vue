<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<svg v-if="type === 'info'" :class="[$style.icon, $style.info]" viewBox="0 0 160 160">
	<path d="M80,108L80,72" style="--l:37;" :class="[$style.line, $style.anim]"/>
	<path d="M80,52L80,52" :class="[$style.line, $style.fade]"/>
	<circle cx="80" cy="80" r="56" style="--l:350;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'question'" :class="[$style.icon, $style.question]" viewBox="0 0 160 160">
	<path d="M80,92L79.991,84C88.799,83.98 96,76.962 96,68C96,59.038 88.953,52 79.991,52C71.03,52 64,59.038 64,68" style="--l:85;" :class="[$style.line, $style.anim]"/>
	<path d="M80,108L80,108" :class="[$style.line, $style.fade]"/>
	<circle cx="80" cy="80" r="56" style="--l:350;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'success'" :class="[$style.icon, $style.success]" viewBox="0 0 160 160">
	<path d="M62,80L74,92L98,68" style="--l:50;" :class="[$style.line, $style.anim]"/>
	<circle cx="80" cy="80" r="56" style="--l:350;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'warn'" :class="[$style.icon, $style.warn]" viewBox="0 0 160 160">
	<path d="M80,64L80,88" style="--l:27;" :class="[$style.line, $style.anim]"/>
	<path d="M80,108L80,108" :class="[$style.line, $style.fade]"/>
	<path d="M92,28L144,116C148.709,124.65 144.083,135.82 136,136L24,136C15.917,135.82 11.291,124.65 16,116L68,28C73.498,19.945 86.771,19.945 92,28Z" style="--l:390;" :class="[$style.line, $style.anim]"/>
</svg>
<svg v-else-if="type === 'error'" :class="[$style.icon, $style.error]" viewBox="0 0 160 160">
	<path d="M63,63L96,96" style="--l:47;--duration:0.3s;" :class="[$style.line, $style.anim]"/>
	<path d="M96,63L63,96" style="--l:47;--duration:0.3s;--delay:0.2s;" :class="[$style.line, $style.anim]"/>
	<circle cx="80" cy="80" r="56" style="--l:350;" :class="[$style.line, $style.anim]"/>
</svg>
</template>

<script lang="ts" setup>
import {} from 'vue';

const props = defineProps<{
	type: 'info' | 'question' | 'success' | 'warn' | 'error';
}>();
</script>

<style lang="scss" module>
.icon {
	stroke-linecap: round;
	stroke-linejoin: round;

	&.info {
		color: var(--MI_THEME-accent);
	}

	&.question {
		color: var(--MI_THEME-fg);
	}

	&.success {
		color: var(--MI_THEME-success);
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
	animation: line-animation var(--duration, 0.5s) cubic-bezier(0,0,.25,1) 1 forwards;
	animation-delay: var(--delay, 0s);
}

.fade {
	opacity: 0;
	animation: fade-in var(--duration, 0.5s) cubic-bezier(0,0,.25,1) 1 forwards;
	animation-delay: var(--delay, 0s);
}

@keyframes line-animation {
	0% {
		stroke-dashoffset: var(--l);
		opacity: 0;
	}
	100% {
		stroke-dashoffset: 0;
		opacity: 1;
	}
}

@keyframes fade-in {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}
</style>
