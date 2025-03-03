<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="[$style.root, { [$style.highlighted]: highlighted }]">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { useInterval } from '@@/js/use-interval.js';
import { onActivated, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, inject } from 'vue';

const props = defineProps<{
	markerId?: string;
	label?: string;
	icon?: string;
	keywords?: string[];
	children?: string[];
	inlining?: string[];
}>();

const rootEl = useTemplateRef<HTMLDivElement>('root');
const searchMarkerId = inject<string>('inAppSearchMarkerId', window.location.hash.slice(1));
const highlighted = ref(props.markerId === searchMarkerId);

function checkChildren() {
	if (props.children?.includes(searchMarkerId)) {
		const el = document.querySelector(`[data-in-app-search-marker-id="${searchMarkerId}"]`);
		highlighted.value = el == null;
	}
}

if (props.children != null && props.children.length > 0) {
	useInterval(() => {
		checkChildren();
	}, 1000, { immediate: false, afterMounted: true });
}

onMounted(() => {
	checkChildren();

	if (highlighted.value) {
		rootEl.value?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}
});

onActivated(() => {
	if (highlighted.value) {
		rootEl.value?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}
});
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
		border: 1px solid color(from var(--MI_THEME-accent) srgb r g b / 0.7);
	}
	50% {
		background: transparent;
		border: 1px solid transparent;
	}
}
</style>
