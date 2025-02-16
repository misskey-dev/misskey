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
	markerId: string;
}>();

const highlighted = window.location.hash.slice(1) === props.markerId;
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
