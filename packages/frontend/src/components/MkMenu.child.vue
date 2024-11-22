<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="el" :class="$style.root">
	<MkMenu :items="items" :align="align" :width="width" :asDrawer="false" @close="onChildClosed"/>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, provide, shallowRef, watch } from 'vue';
import MkMenu from './MkMenu.vue';
import type { MenuItem } from '@/types/menu.js';

const props = defineProps<{
	items: MenuItem[];
	targetElement: HTMLElement;
	rootElement: HTMLElement;
	width?: number;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'actioned'): void;
}>();

provide('isNestingMenu', true);

const el = shallowRef<HTMLElement>();
const align = 'left';

const SCROLLBAR_THICKNESS = 16;

function setPosition() {
	if (el.value == null) return;
	const rootRect = props.rootElement.getBoundingClientRect();
	const parentRect = props.targetElement.getBoundingClientRect();
	const myRect = el.value.getBoundingClientRect();

	let left = props.targetElement.offsetWidth;
	let top = (parentRect.top - rootRect.top) - 8;
	if (rootRect.left + left + myRect.width >= (window.innerWidth - SCROLLBAR_THICKNESS)) {
		left = -myRect.width;
	}
	if (rootRect.top + top + myRect.height >= (window.innerHeight - SCROLLBAR_THICKNESS)) {
		top = top - ((rootRect.top + top + myRect.height) - (window.innerHeight - SCROLLBAR_THICKNESS));
	}
	el.value.style.left = left + 'px';
	el.value.style.top = top + 'px';
}

function onChildClosed(actioned?: boolean) {
	if (actioned) {
		emit('actioned');
	} else {
		emit('closed');
	}
}

watch(() => props.targetElement, () => {
	setPosition();
});

const ro = new ResizeObserver((entries, observer) => {
	setPosition();
});

onMounted(() => {
	if (el.value) ro.observe(el.value);
	setPosition();
	nextTick(() => {
		setPosition();
	});
});

onUnmounted(() => {
	ro.disconnect();
});

defineExpose({
	checkHit: (ev: MouseEvent) => {
		return (ev.target === el.value || el.value?.contains(ev.target as Node));
	},
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
}
</style>
