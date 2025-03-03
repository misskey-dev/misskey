<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.highlighted]: highlighted }]">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';

const props = defineProps<{
	markerId?: string;
	label?: string;
	icon?: string;
	keywords?: string[];
	children?: string[];
	childrenHidden?: boolean;
}>();

const hash = window.location.hash.slice(1);
const highlighted = hash === props.markerId || (props.children && props.childrenHidden && props.children.includes(hash));
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.highlighted {
	&::after {
		content: '';
		position: absolute;
		top: -8px;
		left: -8px;
		width: calc(100% + 16px);
		height: calc(100% + 16px);
		border-radius: 6px;
		animation: blink 1s infinite;
		pointer-events: none;
	}
}

@keyframes blink {
	0%, 100% {
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.05);
		border: 1px solid color(from var(--MI_THEME-accent) srgb r g b / 0.3);
	}
	50% {
		background: transparent;
		border: 1px solid transparent;
	}
}
</style>
