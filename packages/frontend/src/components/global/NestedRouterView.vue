<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Suspense :timeout="0">
	<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)"/>

	<template #fallback>
		<MkLoading/>
	</template>
</Suspense>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, provide, ref, shallowRef } from 'vue';
import type { IRouter, Resolved } from '@/nirax.js';
import MkLoadingPage from '@/pages/_loading_.vue';
import { DI } from '@/di.js';

const props = defineProps<{
	router?: IRouter;
}>();

const router = props.router ?? inject(DI.router);

if (router == null) {
	throw new Error('no router provided');
}

const currentDepth = inject(DI.routerCurrentDepth, 0);
provide(DI.routerCurrentDepth, currentDepth + 1);

function resolveNested(current: Resolved, d = 0): Resolved | null {
	if (d === currentDepth) {
		return current;
	} else {
		if (current.child) {
			return resolveNested(current.child, d + 1);
		} else {
			return null;
		}
	}
}

const current = resolveNested(router.current)!;
const currentPageComponent = shallowRef('component' in current.route ? current.route.component : MkLoadingPage);
const currentPageProps = ref(current.props);
const key = ref(router.getCurrentKey() + JSON.stringify(Object.fromEntries(current.props)));

function onChange({ resolved, key: newKey }) {
	const current = resolveNested(resolved);
	if (current == null || 'redirect' in current.route) return;
	currentPageComponent.value = current.route.component;
	currentPageProps.value = current.props;
	key.value = newKey + JSON.stringify(Object.fromEntries(current.props));
}

router.addListener('change', onChange);

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
});
</script>
