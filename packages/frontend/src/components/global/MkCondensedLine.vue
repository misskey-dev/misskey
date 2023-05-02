<template>
<span :class="$style.container">
	<span ref="content" :class="$style.content">
		<slot/>
	</span>
</span>
</template>

<script lang="ts">
const observer = new ResizeObserver((entries) => {
	for (const entry of entries) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const container = entry.target.parentElement!;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const contentWidth = entry.contentBoxSize?.[0].inlineSize ?? entry.contentRect.width;
		const containerWidth = container.getBoundingClientRect().width;
		container.style.transform = `scaleX(${Math.min(1, containerWidth / contentWidth)})`;
	}
});
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const content = ref<HTMLSpanElement>();

onMounted(() => {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const target = content.value!;
	observer.observe(target);

	return (): void => {
		observer.unobserve(target);
	};
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
