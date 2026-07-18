<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_pageContainer" :class="$style.root">
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

const _router = props.router ?? inject(DI.router);

if (_router == null) {
	throw new Error('no router provided');
}

const router = _router;

const viewId = randomId();
provide(DI.viewId, viewId);

const currentDepth = inject(DI.routerCurrentDepth, 0);
provide(DI.routerCurrentDepth, currentDepth + 1);

const current = router.current;
const currentPageComponent = shallowRef('component' in current.route ? current.route.component : MkLoadingPage);
const currentPageProps = ref(current.props);
let currentRoutePath = current.route.path;
const key = ref(router.getCurrentFullPath());

router.useListener('change', ({ resolved }) => {
	if (resolved == null || 'redirect' in resolved.route) return;
	if (resolved.route.path === currentRoutePath && deepEqual(resolved.props, currentPageProps.value)) return;

	currentPageComponent.value = resolved.route.component;
	currentPageProps.value = resolved.props;
	key.value = router.getCurrentFullPath();
	currentRoutePath = resolved.route.path;
});
</script>

<style lang="scss" module>
.root {
	height: 100%;
	background-color: var(--MI_THEME-bg);

	/**
	 * FIXME: Safari 26 で contain: layout を指定するとバグるので、hotfixとして _pageContainer の content: strict を上書き
	 * https://github.com/misskey-dev/misskey/issues/16204#issuecomment-3265404776
	 * https://bugs.webkit.org/show_bug.cgi?id=297186
	 */
	contain: size style paint !important;
}
</style>
