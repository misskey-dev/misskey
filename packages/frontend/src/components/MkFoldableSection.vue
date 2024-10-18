<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<header :class="$style.header" class="_button" :style="{ background: bg }" @click="showBody = !showBody">
		<div :class="$style.title"><div><slot name="header"></slot></div></div>
		<div :class="$style.divider"></div>
		<button class="_button" :class="$style.button">
			<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
	</header>
	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.folderToggleEnterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.folderToggleLeaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.folderToggleEnterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.folderToggleLeaveTo : ''"
		@enter="enter"
		@afterEnter="afterEnter"
		@leave="leave"
		@afterLeave="afterLeave"
	>
		<div v-show="showBody">
			<slot></slot>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import tinycolor from 'tinycolor2';
import { miLocalStorage } from '@/local-storage.js';
import { defaultStore } from '@/store.js';

const miLocalStoragePrefix = 'ui:folder:' as const;

const props = withDefaults(defineProps<{
	expanded?: boolean;
	persistKey?: string;
}>(), {
	expanded: true,
});

const rootEl = shallowRef<HTMLDivElement>();
const bg = ref<string>();
const showBody = ref((props.persistKey && miLocalStorage.getItem(`${miLocalStoragePrefix}${props.persistKey}`)) ? (miLocalStorage.getItem(`${miLocalStoragePrefix}${props.persistKey}`) === 't') : props.expanded);

watch(showBody, () => {
	if (props.persistKey) {
		miLocalStorage.setItem(`${miLocalStoragePrefix}${props.persistKey}`, showBody.value ? 't' : 'f');
	}
});

function enter(element: Element) {
	const el = element as HTMLElement;
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = elementHeight + 'px';
}

function afterEnter(element: Element) {
	const el = element as HTMLElement;
	el.style.height = 'unset';
}

function leave(element: Element) {
	const el = element as HTMLElement;
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = '0';
}

function afterLeave(element: Element) {
	const el = element as HTMLElement;
	el.style.height = 'unset';
}

onMounted(() => {
	function getParentBg(el?: HTMLElement | null): string {
		if (el == null || el.tagName === 'BODY') return 'var(--MI_THEME-bg)';
		const background = el.style.background || el.style.backgroundColor;
		if (background) {
			return background;
		} else {
			return getParentBg(el.parentElement);
		}
	}

	const rawBg = getParentBg(rootEl.value);
	const _bg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	_bg.setAlpha(0.85);
	bg.value = _bg.toRgbString();
});
</script>

<style lang="scss" module>
.folderToggleEnterActive, .folderToggleLeaveActive {
	overflow-y: clip;
	transition: opacity 0.5s, height 0.5s !important;
}

.folderToggleEnterFrom, .folderToggleLeaveTo {
	opacity: 0;
}

.root {
	position: relative;
}

.header {
	display: flex;
	position: relative;
	z-index: 10;
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	-webkit-backdrop-filter: var(--MI-blur, blur(8px));
	backdrop-filter: var(--MI-blur, blur(20px));
}

.title {
	display: grid;
	place-content: center;
	margin: 0;
	padding: 12px 16px 12px 0;
}

.divider {
	flex: 1;
	margin: auto;
	height: 1px;
	background: var(--MI_THEME-divider);
}

.button {
	padding: 12px 0 12px 16px;
}

@container (max-width: 500px) {
	.title {
		padding: 8px 10px 8px 0;
	}
}
</style>
