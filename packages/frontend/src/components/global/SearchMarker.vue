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
}>();

const hash = window.location.hash.slice(1);
const highlighted = hash === props.markerId || (props.children && props.children.includes(hash));
</script>

<style lang="scss" module>
.root {
}

.highlighted {
	animation: blink 1s infinite;
}

@keyframes blink {
	0%, 100% {
		box-shadow: 0 0 0 2px color(from var(--MI_THEME-accent) srgb r g b / 0.3);
	}
	50% {
		box-shadow: 0 0 0 2px transparent;
	}
}
</style>
