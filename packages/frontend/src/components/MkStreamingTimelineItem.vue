<template>
	<div
		ref="rootEl"
		:class="[$style.root, {
			[$style.enter]: animatingIn,
			[$style.leave]: animatingOut,
		}]"
	>
		<slot></slot>
	</div>
</template>

<script lang="ts">
export const ITEM_REMOVAL_MS = 200;

const supportsInterpolateSize = CSS.supports('interpolate-size: allow-keywords');
let resizeObserver: ResizeObserver | null = null;

if (!supportsInterpolateSize) {
	resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const target = entry.target as HTMLElement;
			target.style.setProperty('--child-height', `${entry.contentRect.height}px`);
		}
	});
}
</script>

<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
	animatingIn?: boolean;
	animatingOut?: boolean;
}>();

const rootEl = useTemplateRef('rootEl');

onMounted(() => {
	if (resizeObserver != null && rootEl.value != null) {
		resizeObserver.observe(rootEl.value);
		rootEl.value.style.setProperty('--child-height', `${rootEl.value.getBoundingClientRect().height}px`);
	}
});

onUnmounted(() => {
	if (resizeObserver != null && rootEl.value != null) {
		resizeObserver.unobserve(rootEl.value);
	}
});
</script>

<style module lang="scss">
.root {
	overflow: clip;
	transition: height 0.2s cubic-bezier(0,.5,.5,1), opacity 0.2s cubic-bezier(0,.5,.5,1);
}

.enter {
	animation: enterAnim 0.7s cubic-bezier(0.23, 1, 0.32, 1) both;
}

.leave {
	animation: leaveAnim 0.2s cubic-bezier(0,.5,.5,1) both;
}

@supports (interpolate-size: allow-keywords) {
	.root {
		interpolate-size: allow-keywords;
	}
}

@keyframes enterAnim {
	from {
		height: 0;
		opacity: 0;
		transform: translateY(max(-64px, -100%));
	}

	to {
		height: var(--child-height, auto);
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes leaveAnim {
	from {
		height: var(--child-height, auto);
		opacity: 1;
	}

	to {
		height: 0;
		opacity: 0;
	}
}
</style>
