<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" role="group" :aria-expanded="opened">
	<header :class="[$style.header, { [$style.opened]: opened }]" class="_button" role="button" data-cy-folder-header @click="toggle">
		<div :class="$style.title"><div><slot name="header"></slot></div></div>
		<div :class="$style.divider"></div>
		<button class="_button" :class="$style.button">
			<template v-if="opened"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
	</header>
	<div v-if="openedAtLeastOnce" :class="[$style.body, { [$style.bgSame]: bgSame }]" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : null, overflow: maxHeight ? `auto` : null }" :aria-hidden="!opened">
		<Transition
			:enterActiveClass="defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
			:leaveActiveClass="defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
			:enterFromClass="defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
			:leaveToClass="defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
			@enter="enter"
			@afterEnter="afterEnter"
			@leave="leave"
			@afterLeave="afterLeave"
		>
			<div v-show="opened">
				<slot></slot>
			</div>
		</Transition>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, shallowRef, ref, watch } from 'vue';
import { defaultStore } from '@/store.js';
const miLocalStoragePrefix = 'ui:folder:' as const;

const props = withDefaults(defineProps<{
    defaultOpen?: boolean;
    maxHeight?: number | null;
}>(), {
	defaultOpen: true,
	maxHeight: null,
});
const getBgColor = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    if (style.backgroundColor && !['rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)', 'transparent'].includes(style.backgroundColor)) {
        return style.backgroundColor;
    } else {
        return el.parentElement ? getBgColor(el.parentElement) : 'transparent';
    }
};
const rootEl = shallowRef<HTMLDivElement>();
const bg = ref<string>();
const showBody = ref((props.persistKey && miLocalStorage.getItem(`${miLocalStoragePrefix}${props.persistKey}`)) ? (miLocalStorage.getItem(`${miLocalStoragePrefix}${props.persistKey}`) === 't') : props.expanded);

watch(showBody, () => {
	if (props.persistKey) {
		miLocalStorage.setItem(`${miLocalStoragePrefix}${props.persistKey}`, showBody.value ? 't' : 'f');
	}
});

const rootEl = shallowRef<HTMLElement>();
const bgSame = ref(false);
const opened = ref(props.defaultOpen);
const openedAtLeastOnce = ref(props.defaultOpen);

function enter(element: Element) {
	const el = element as HTMLElement;
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = Math.min(elementHeight, props.maxHeight ?? Infinity) + 'px';
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

function toggle() {
	if (!opened.value) {
		openedAtLeastOnce.value = true;
	}

	nextTick(() => {
		opened.value = !opened.value;
	});
}

onMounted(() => {
	function getParentBg(el?: HTMLElement | null): string {
		if (el == null || el.tagName === 'BODY') return 'var(--bg)';
		const background = el.style.background || el.style.backgroundColor;
		if (background) {
			return background;
		} else {
			return getParentBg(el.parentElement);
		}
	}
    const computedStyle = getComputedStyle(document.documentElement);
    const parentBg = getBgColor(rootEl.value.parentElement);
    const myBg = computedStyle.getPropertyValue('--panel');
    bgSame.value = parentBg === myBg;
	const rawBg = getParentBg(rootEl.value);
	const _bg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	_bg.setAlpha(0.85);
	bg.value = _bg.toRgbString();
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
  overflow-y: clip;
  transition: opacity 0.3s, height 0.3s, transform 0.3s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
  opacity: 0;
}

.root {
  display: block;
}

.header {
  display: flex;
  position: relative;
  z-index: 10;
  position: sticky;
  top: var(--stickyTop, 0px);
  -webkit-backdrop-filter: var(--blur, blur(8px));
  backdrop-filter: var(--blur, blur(20px));

  &.opened {
    border-radius: 6px 6px 0 0;
  }
}

.headerUpper {
  display: flex;
  align-items: center;
}

.headerLower {
  color: var(--fgTransparentWeak);
  font-size: .85em;
  padding-left: 4px;
}

.headerIcon {
  margin-right: 0.75em;
  flex-shrink: 0;
  text-align: center;
  opacity: 0.8;

  &:empty {
    display: none;

    & + .headerText {
      padding-left: 4px;
    }
  }
}
.title {
  display: grid;
  place-content: center;
  margin: 0;
  padding: 12px 16px 12px 0;
}
.headerText {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding-right: 12px;
}

.headerTextSub {
  color: var(--fgTransparentWeak);
  font-size: .85em;
}

.headerRight {
  margin-left: auto;
  color: var(--fgTransparentWeak);
  white-space: nowrap;
}

.headerRightText:not(:empty) {
  margin-right: 0.75em;
}

.divider {
  flex: 1;
  margin: auto;
  height: 1px;
  background: var(--divider);
}
</style>
