<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<TransitionGroup
	:enterActiveClass="prefer.s.animation ? $style.transition_x_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_x_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_x_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_x_leaveTo : ''"
	:moveClass="prefer.s.animation ? $style.transition_x_move : ''"
	:duration="200"
	tag="div" :class="$style.tabs"
>
	<div v-for="(tab, i) in tabs" :key="tab.fullPath" :class="$style.tab" :style="{ '--i': i - 1 }">
		<div v-if="i > 0" :class="$style.tabBg" @click="back()"></div>
		<div :class="$style.tabFg" @click.stop="back()">
			<div v-if="i > 0" :class="$style.tabMenu">
				<svg :class="$style.tabMenuShape" viewBox="0 0 24 16">
					<g transform="matrix(2.04108e-17,-0.333333,0.222222,1.36072e-17,21.3333,15.9989)">
						<path d="M23.997,-42C47.903,-23.457 47.997,12 47.997,12L-0.003,12L-0.003,-96C-0.003,-96 0.091,-60.543 23.997,-42Z" style="fill:var(--MI_THEME-panel);"/>
					</g>
				</svg>
				<button :class="$style.tabMenuButton" class="_button" @click.stop="mount"><i class="ti ti-rectangle"></i></button>
				<button :class="$style.tabMenuButton" class="_button" @click.stop="back"><i class="ti ti-x"></i></button>
			</div>
			<div v-if="i > 0" :class="$style.tabBorder"></div>
			<div :class="$style.tabContent" class="_pageContainer" @click.stop="">
				<Suspense :timeout="0">
					<component :is="tab.component" v-bind="Object.fromEntries(tab.props)"/>

					<template #fallback>
						<MkLoading/>
					</template>
				</Suspense>
			</div>
		</div>
	</div>
</TransitionGroup>
</template>

<script lang="ts" setup>
import { inject, provide, shallowRef } from 'vue';
import type { Router } from '@/router.js';
import { prefer } from '@/preferences.js';
import MkLoadingPage from '@/pages/_loading_.vue';
import { DI } from '@/di.js';
import { deepEqual } from '@/utility/deep-equal.js';

const props = defineProps<{
	router?: Router;
}>();

const router = props.router ?? inject(DI.router);

if (router == null) {
	throw new Error('no router provided');
}

const currentDepth = inject(DI.routerCurrentDepth, 0);
provide(DI.routerCurrentDepth, currentDepth + 1);

const tabs = shallowRef([{
	fullPath: router.getCurrentFullPath(),
	routePath: router.current.route.path,
	component: 'component' in router.current.route ? router.current.route.component : MkLoadingPage,
	props: router.current.props,
}]);

function mount() {
	const currentTab = tabs.value[tabs.value.length - 1];
	tabs.value = [currentTab];
}

function back() {
	if (tabs.value.length <= 1) return; // transitionの関係でタブが1つの状態でbackが呼ばれることがある
	const prev = tabs.value[tabs.value.length - 2];
	tabs.value = [...tabs.value.slice(0, tabs.value.length - 1)];
	router?.replaceByPath(prev.fullPath);
}

router.useListener('change', ({ resolved }) => {
	const currentTab = tabs.value[tabs.value.length - 1];
	const routePath = resolved.route.path;
	if (resolved == null || 'redirect' in resolved.route) return;
	if (resolved.route.path === currentTab.routePath && deepEqual(resolved.props, currentTab.props)) return;
	const fullPath = router.getCurrentFullPath();

	if (tabs.value.some(tab => tab.routePath === routePath && deepEqual(resolved.props, tab.props))) {
		const newTabs = [] as typeof tabs.value;
		for (const tab of tabs.value) {
			newTabs.push(tab);

			if (tab.routePath === routePath && deepEqual(resolved.props, tab.props)) {
				break;
			}
		}
		tabs.value = newTabs;
		return;
	}

	tabs.value = tabs.value.length >= prefer.s.numberOfPageCache ? [
		...tabs.value.slice(1),
		{
			fullPath: fullPath,
			routePath,
			component: resolved.route.component,
			props: resolved.props,
		},
	] : [...tabs.value, {
		fullPath: fullPath,
		routePath,
		component: resolved.route.component,
		props: resolved.props,
	}];
});

router.useListener('replace', ({ fullPath }) => {
	const currentTab = tabs.value[tabs.value.length - 1];
	currentTab.fullPath = fullPath;
	tabs.value = [...tabs.value.slice(0, tabs.value.length - 1), currentTab];
});
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	.tabBg {
		transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
	}

	.tabFg {
		transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
	}
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	.tabBg {
		opacity: 0;
	}

	.tabFg {
		opacity: 0;
		transform: translateY(100px);
	}
}
.transition_x_leaveActive {
	.tabFg {
		//position: absolute;
	}
}

.tabs {
	position: relative;
	width: 100%;
	height: 100%;
}

.tab {
	overflow: clip;

	&:first-child {
		position: relative;
		width: 100%;
		height: 100%;

		.tabFg {
			position: relative;
			width: 100%;
			height: 100%;
		}
	}

	&:not(:first-child) {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;

		.tabBg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: #0003;
			-webkit-backdrop-filter: var(--MI-blur, blur(3px));
			backdrop-filter: var(--MI-blur, blur(3px));
		}

		.tabFg {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: calc(100% - (10px + (20px * var(--i))));
			display: flex;
			flex-direction: column;
		}

		.tabContent {
			flex: 1;
		}
	}
}

.tabContent {
	position: relative;
	width: 100%;
	height: 100%;
	background: var(--MI_THEME-bg);
}

.tabMenu {
	position: relative;
	margin-left: auto;
	padding: 0 4px;
	background: var(--MI_THEME-panel);
}

.tabMenuShape {
	position: absolute;
	bottom: -1px;
	left: -100%;
	height: calc(100% + 1px);
	width: 129%;
	pointer-events: none;
}

.tabBorder {
	height: 6px;
	background: var(--MI_THEME-panel);
}

.tabMenuButton {
	padding: 8px;
	font-size: 13px;
}
</style>
