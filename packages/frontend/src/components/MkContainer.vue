<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" class="_panel" :class="[$style.root, { [$style.naked]: naked, [$style.thin]: thin, [$style.scrollable]: scrollable }]">
	<header v-if="showHeader" ref="headerEl" :class="$style.header">
		<div :class="$style.title">
			<span :class="$style.titleIcon"><slot name="icon"></slot></span>
			<slot name="header"></slot>
		</div>
		<div :class="$style.headerSub">
			<slot name="func" :buttonStyleClass="$style.headerButton"></slot>
			<button v-if="foldable" :class="$style.headerButton" class="_button" @click="() => showBody = !showBody">
				<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
				<template v-else><i class="ti ti-chevron-down"></i></template>
			</button>
		</div>
	</header>
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
		<div v-show="showBody" ref="contentEl" :class="[$style.content, { [$style.omitted]: omitted }]">
			<slot></slot>
			<button v-if="omitted" :class="$style.fade" class="_button" @click="() => { ignoreOmit = true; omitted = false; }">
				<span :class="$style.fadeLabel">{{ i18n.ts.showMore }}</span>
			</button>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	showHeader?: boolean;
	thin?: boolean;
	naked?: boolean;
	foldable?: boolean;
	scrollable?: boolean;
	expanded?: boolean;
	maxHeight?: number | null;
}>(), {
	expanded: true,
	showHeader: true,
	maxHeight: null,
});

const rootEl = shallowRef<HTMLElement>();
const contentEl = shallowRef<HTMLElement>();
const headerEl = shallowRef<HTMLElement>();
const showBody = ref(props.expanded);
const ignoreOmit = ref(false);
const omitted = ref(false);

function enter(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = 0;
	el.offsetHeight; // reflow
	el.style.height = Math.min(elementHeight, props.maxHeight ?? Infinity) + 'px';
}

function afterEnter(el) {
	el.style.height = null;
}

function leave(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = 0;
}

function afterLeave(el) {
	el.style.height = null;
}

const calcOmit = () => {
	if (omitted.value || ignoreOmit.value || props.maxHeight == null) return;
	if (!contentEl.value) return;
	const height = contentEl.value.offsetHeight;
	omitted.value = height > props.maxHeight;
};

const omitObserver = new ResizeObserver((entries, observer) => {
	calcOmit();
});

onMounted(() => {
	watch(showBody, v => {
		if (!rootEl.value) return;
		const headerHeight = props.showHeader ? headerEl.value?.offsetHeight ?? 0 : 0;
		rootEl.value.style.minHeight = `${headerHeight}px`;
		if (v) {
			rootEl.value.style.flexBasis = 'auto';
		} else {
			rootEl.value.style.flexBasis = `${headerHeight}px`;
		}
	}, {
		immediate: true,
	});

	if (rootEl.value) rootEl.value.style.setProperty('--maxHeight', props.maxHeight + 'px');

	calcOmit();

	if (contentEl.value) omitObserver.observe(contentEl.value);
});

onUnmounted(() => {
	omitObserver.disconnect();
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	overflow-y: clip;
	transition: opacity 0.5s, height 0.5s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	position: relative;
	overflow: clip;
	contain: content;

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	&.scrollable {
		display: flex;
		flex-direction: column;

		> .content {
			overflow: auto;
		}
	}

	&.thin {
		> .header {
			> .title {
				padding: 8px 10px;
				font-size: 0.9em;
			}
		}
	}
}

.header {
	position: sticky;
	top: var(--stickyTop, 0px);
	left: 0;
	color: var(--panelHeaderFg);
	background: var(--panelHeaderBg);
	border-bottom: solid 0.5px var(--panelHeaderDivider);
	z-index: 2;
	line-height: 1.4em;
}

.title {
	margin: 0;
	padding: 12px 16px;

	&:empty {
		display: none;
	}
}

.titleIcon {
	margin-right: 6px;
}

.headerSub {
	position: absolute;
	z-index: 2;
	top: 0;
	right: 0;
	height: 100%;
}

.headerButton {
	width: 42px;
	height: 100%;
}

.content {
	--stickyTop: 0px;

	&.omitted {
		position: relative;
		max-height: var(--maxHeight);
		overflow: hidden;

		> .fade {
			display: block;
			position: absolute;
			z-index: 10;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--panel), var(--X15));

			> .fadeLabel {
				display: inline-block;
				background: var(--panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--panelHighlight);
				}
			}
		}
	}
}

@container (max-width: 380px) {
	.title {
		padding: 8px 10px;
		font-size: 0.9em;
	}
}
</style>
