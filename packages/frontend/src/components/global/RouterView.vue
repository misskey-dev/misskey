<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<KeepAlive :max="defaultStore.state.numberOfPageCache">
	<Suspense :timeout="0">
		<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)"/>

		<template #fallback>
			<MkLoading/>
		</template>
	</Suspense>
</KeepAlive>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, provide, shallowRef, ref } from 'vue';
import { Resolved, Router } from '@/nirax.js';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	router?: Router;
}>();

const router = props.router ?? inject('router');

if (router == null) {
	throw new Error('no router provided');
}

const currentDepth = inject('routerCurrentDepth', 0);
provide('routerCurrentDepth', currentDepth + 1);

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
const currentPageComponent = shallowRef(current.route.component);
const currentPageProps = ref(current.props);
const key = ref(current.route.path + JSON.stringify(Object.fromEntries(current.props)));

function onChange({ resolved, key: newKey }) {
	const current = resolveNested(resolved);
	if (current == null) return;
	currentPageComponent.value = current.route.component;
	currentPageProps.value = current.props;
	key.value = current.route.path + JSON.stringify(Object.fromEntries(current.props));
}

router.addListener('change', onChange);

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
});
</script>
