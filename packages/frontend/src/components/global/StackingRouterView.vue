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
	tag="div" :class="$style.root"
>
	<div v-for="(tab, i) in tabs" :key="tab.key" :class="$style.tab" :style="{ '--i': i }">
		<div v-if="i > 0" :class="$style.tabBg" @click="back()"></div>
		<div :class="$style.tabFg">
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
import { inject, onBeforeUnmount, provide, ref, shallowRef, computed, nextTick } from 'vue';
import type { IRouter, Resolved, RouteDef } from '@/nirax.js';
import { prefer } from '@/preferences.js';
import { globalEvents } from '@/events.js';
import MkLoadingPage from '@/pages/_loading_.vue';
import { DI } from '@/di.js';
import { deepEqual } from '@/utility/deep-equal.js';

const props = defineProps<{
	router?: IRouter;
}>();

const router = props.router ?? inject(DI.router);

if (router == null) {
	throw new Error('no router provided');
}

const currentDepth = inject(DI.routerCurrentDepth, 0);
provide(DI.routerCurrentDepth, currentDepth + 1);

const current = router.current!;
const key = ref(router.getCurrentKey() + JSON.stringify(Object.fromEntries(current.props)));

const tabs = shallowRef([{
	key: key.value,
	path: router.getCurrentPath(),
	component: 'component' in current.route ? current.route.component : MkLoadingPage,
	props: current.props,
}]);

function onChange({ resolved, key: newKey }) {
	const currentTab = tabs.value[tabs.value.length - 1];
	if (resolved == null || 'redirect' in resolved.route) return;
	if (resolved.route.path === currentTab.path && deepEqual(resolved.props, currentTab.props)) return;
	key.value = newKey + JSON.stringify(Object.fromEntries(resolved.props));

	if (tabs.value.some(tab => tab.key === key.value)) {
		const newTabs = [];
		for (const tab of tabs.value) {
			newTabs.push(tab);

			if (tab.key === key.value) {
				break;
			}
		}
		tabs.value = newTabs;
		return;
	}

	tabs.value = tabs.value.length >= prefer.s.numberOfPageCache ? [
		...tabs.value.slice(1),
		{
			key: key.value,
			path: router.getCurrentPath(),
			component: resolved.route.component,
			props: resolved.props,
		},
	] : [...tabs.value, {
		key: key.value,
		path: router.getCurrentPath(),
		component: resolved.route.component,
		props: resolved.props,
	}];
}

function back() {
	const last = tabs.value[tabs.value.length - 1];
	router.replace(last.path, last.key);
	tabs.value = [...tabs.value.slice(0, tabs.value.length - 1)];
}

router.addListener('change', onChange);

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
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

.root {
	position: relative;
	height: 100%;
	overflow: clip;
}

.tabBg {
	position: absolute;
	z-index: 1;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: #0003;
	-webkit-backdrop-filter: var(--MI-blur, blur(3px));
	backdrop-filter: var(--MI-blur, blur(3px));
}

.tab {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	box-sizing: border-box;

	&:not(:nth-child(1)) {
		.tabFg {
			position: absolute;
			z-index: 1;
			bottom: 0;
			left: 0;
			width: 100%;
			height: calc(100% - 20px * var(--i));
		}
	}
}

.tabFg {
	position: relative;
	height: 100%;
	background: var(--MI_THEME-bg);
	border-radius: 16px 16px 0 0;
	overflow: clip;
}

.tabContent {
	height: 100%;
}
</style>
