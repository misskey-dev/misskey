<template>
<span :class="$style.container">
	<span ref="content" :class="$style.content">
		<slot/>
	</span>
</span>
</template>

<script lang="ts">
const contentSymbol = Symbol();
const observer = new ResizeObserver((entries) => {
	for (const entry of entries) {
		const content = (entry.target[contentSymbol] ? entry.target : entry.target.firstElementChild) as HTMLSpanElement;
		const container = content.parentElement as HTMLSpanElement;
		const contentWidth = content.getBoundingClientRect().width;
		const containerWidth = container.getBoundingClientRect().width;
		container.style.transform = `scaleX(${Math.min(1, containerWidth / contentWidth)})`;
	}
});
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';

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
		value[contentSymbol] = contentSymbol;
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
	width: 100%;
	transform-origin: 0;
}

.content {
	display: inline-block;
	white-space: nowrap;
}
</style>
