<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :class="$style.container">
	<span ref="content" :class="$style.content" :style="{ maxWidth: `${100 / minScale}%` }">
		<slot></slot>
	</span>
</span>
</template>

<script lang="ts">
interface Props {
	readonly minScale?: number;
}

const contentSymbol = Symbol();
const observer = new ResizeObserver((entries) => {
	const results: {
		container: HTMLSpanElement;
		transform: string;
	}[] = [];
	for (const entry of entries) {
		const content = ((entry.target as any)[contentSymbol] ? entry.target : entry.target.firstElementChild) as HTMLSpanElement;
		const props: Required<Props> = (content as any)[contentSymbol];
		const container = content.parentElement as HTMLSpanElement;
		const contentWidth = content.getBoundingClientRect().width;
		const containerWidth = container.getBoundingClientRect().width;
		results.push({ container, transform: `scaleX(${Math.max(props.minScale, Math.min(1, containerWidth / contentWidth))})` });
	}
	for (const result of results) {
		result.container.style.transform = result.transform;
	}
});
</script>

<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';

const props = withDefaults(defineProps<Props>(), {
	minScale: 0,
});

const content = useTemplateRef('content');

function unobserve(el: HTMLSpanElement | null) {
	if (el != null) {
		delete (el as any)[contentSymbol];
		observer.unobserve(el);
		if (el.parentElement) {
			observer.unobserve(el.parentElement);
		}
	}
}

function observe(el: HTMLSpanElement | null) {
	if (el != null) {
		(el as any)[contentSymbol] = props;
		observer.observe(el);
		if (el.parentElement) {
			observer.observe(el.parentElement);
		}
	}
}

watch(content, (value, oldValue) => {
	unobserve(oldValue);
	observe(value);
});

onBeforeUnmount(() => {
	unobserve(content.value);
});
</script>

<style module lang="scss">
.container {
	display: inline-block;
	max-width: 100%;
	transform-origin: 0;
}

.content {
	display: inline-block;
	white-space: nowrap;
}
</style>
