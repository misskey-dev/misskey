<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div
		ref="rootEl"
		:class="[$style.root, {
			[$style.enter]: animatingIn,
			[$style.leave]: animatingOut,
			[$style.animating]: animating,
		}]"
		@animationstart="animating = true"
		@animationend="animating = false"
	>
		<div ref="innerEl">
			<slot></slot>
		</div>
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
			const root = target.parentElement;
			if (root != null) {
				root.style.setProperty('--child-height', `${entry.contentRect.height}px`);
			}
		}
	});
}
</script>

<script setup lang="ts">
import { useTemplateRef, onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
	animatingIn?: boolean;
	animatingOut?: boolean;
}>();

const rootEl = useTemplateRef('rootEl');
const innerEl = useTemplateRef('innerEl');

const animating = ref(false);

onMounted(() => {
	if (resizeObserver != null && rootEl.value != null && innerEl.value != null) {
		resizeObserver.observe(innerEl.value);
		rootEl.value.style.setProperty('--child-height', `${innerEl.value.getBoundingClientRect().height}px`);
	}
});

onBeforeUnmount(() => {
	if (resizeObserver != null && innerEl.value != null) {
		resizeObserver.unobserve(innerEl.value);
	}
});
</script>

<style module lang="scss">
.animating {
	overflow: clip;
}

.inner {
	display: flow-root;
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
