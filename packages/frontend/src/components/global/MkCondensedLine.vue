<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :class="$style.container">
	<span ref="content" :class="$style.content">
		<slot/>
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
		const content = (entry.target[contentSymbol] ? entry.target : entry.target.firstElementChild) as HTMLSpanElement;
		const props: Required<Props> = content[contentSymbol];
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
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<Props>(), {
	minScale: 0,
});

const content = ref<HTMLSpanElement>();

watch(content, (value, oldValue) => {
	if (oldValue) {
		delete oldValue[contentSymbol];
		observer.unobserve(oldValue);
		if (oldValue.parentElement) {
			observer.unobserve(oldValue.parentElement);
		}
	}
	if (value) {
		value[contentSymbol] = props;
		observer.observe(value);
		if (value.parentElement) {
			observer.observe(value.parentElement);
		}
	}
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
