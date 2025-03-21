<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" class="_pageContainer" :class="$style.root">
	<KeepAlive :max="prefer.s.numberOfPageCache">
		<Suspense :timeout="0">
			<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)"/>

			<template #fallback>
				<MkLoading/>
			</template>
		</Suspense>
	</KeepAlive>
</div>
</template>

<script lang="ts" setup>
import { inject, nextTick, onMounted, provide, ref, shallowRef, useTemplateRef } from 'vue';
import type { Router } from '@/router.js';
import { prefer } from '@/preferences.js';
import MkLoadingPage from '@/pages/_loading_.vue';
import { DI } from '@/di.js';
import { randomId } from '@/utility/random-id.js';
import { deepEqual } from '@/utility/deep-equal.js';

const props = defineProps<{
	router?: Router;
}>();

const router = props.router ?? inject(DI.router);

if (router == null) {
	throw new Error('no router provided');
}

const viewId = randomId();
provide(DI.viewId, viewId);

const currentDepth = inject(DI.routerCurrentDepth, 0);
provide(DI.routerCurrentDepth, currentDepth + 1);

const rootEl = useTemplateRef('rootEl');
onMounted(() => {
	rootEl.value.style.viewTransitionName = viewId; // view-transition-nameにcss varが使えないっぽいため直接代入
});

// view-transition-newなどの<pt-name-selector>にはcss varが使えず、v-bindできないため直接スタイルを生成
const viewTransitionStylesTag = window.document.createElement('style');
viewTransitionStylesTag.textContent = `
@keyframes ${viewId}-old {
	to { transform: scale(0.95); opacity: 0; }
}

@keyframes ${viewId}-new {
	from { transform: scale(0.95); opacity: 0; }
}

::view-transition-old(${viewId}) {
	animation-duration: 0.2s;
  animation-name: ${viewId}-old;
}

::view-transition-new(${viewId}) {
	animation-duration: 0.2s;
  animation-name: ${viewId}-new;
}
`;

window.document.head.appendChild(viewTransitionStylesTag);

const current = router.current!;
const currentPageComponent = shallowRef('component' in current.route ? current.route.component : MkLoadingPage);
const currentPageProps = ref(current.props);
let currentRoutePath = current.route.path;
const key = ref(router.getCurrentFullPath());

router.useListener('change', ({ resolved }) => {
	if (resolved == null || 'redirect' in resolved.route) return;
	if (resolved.route.path === currentRoutePath && deepEqual(resolved.props, currentPageProps.value)) return;

	function _() {
		currentPageComponent.value = resolved.route.component;
		currentPageProps.value = resolved.props;
		key.value = router.getCurrentFullPath();
		currentRoutePath = resolved.route.path;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (prefer.s.animation && window.document.startViewTransition) {
		window.document.startViewTransition(() => new Promise((res) => {
			_();
			nextTick(() => {
				res();
				//setTimeout(res, 100);
			});
		}));
	} else {
		_();
	}
});
</script>

<style lang="scss" module>
.root {
	height: 100%;
	background-color: var(--MI_THEME-bg);
}
</style>
