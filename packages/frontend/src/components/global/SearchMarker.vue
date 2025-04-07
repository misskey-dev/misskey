<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="[$style.root, { [$style.highlighted]: highlighted }]">
	<slot :isParentOfTarget="isParentOfTarget"></slot>
</div>
</template>

<script lang="ts" setup>
import {
	onActivated,
	onDeactivated,
	onMounted,
	onBeforeUnmount,
	watch,
	computed,
	ref,
	useTemplateRef,
	inject,
} from 'vue';
import { DI } from '@/di.js';

const props = defineProps<{
	markerId?: string;
	label?: string;
	icon?: string;
	keywords?: string[];
	children?: string[];
	inlining?: string[];
}>();

const rootEl = useTemplateRef('root');
const rootElMutationObserver = new MutationObserver(() => {
	checkChildren();
});
const injectedSearchMarkerId = inject(DI.inAppSearchMarkerId, null);
const searchMarkerId = computed(() => injectedSearchMarkerId?.value ?? window.location.hash.slice(1));
const highlighted = ref(props.markerId === searchMarkerId.value);
const isParentOfTarget = computed(() => props.children?.includes(searchMarkerId.value));

function checkChildren() {
	if (isParentOfTarget.value) {
		const el = window.document.querySelector(`[data-in-app-search-marker-id="${searchMarkerId.value}"]`);
		highlighted.value = el == null;
	}
}

watch([
	searchMarkerId,
	() => props.children,
], () => {
	if (props.children != null && props.children.length > 0) {
		checkChildren();
	}
}, { flush: 'post' });

function init() {
	checkChildren();

	if (highlighted.value) {
		rootEl.value?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}

	if (rootEl.value != null) {
		rootElMutationObserver.observe(rootEl.value, {
			childList: true,
			subtree: true,
		});
	}
}

function dispose() {
	rootElMutationObserver.disconnect();
}

onMounted(init);
onActivated(init);
onDeactivated(dispose);
onBeforeUnmount(dispose);
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
		animation: blink 1s 3.5;
		pointer-events: none;
	}
}

@keyframes blink {
	0%, 100% {
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.1);
		border: 1px solid color(from var(--MI_THEME-accent) srgb r g b / 0.75);
	}
	50% {
		background: transparent;
		border: 1px solid transparent;
	}
}
</style>
