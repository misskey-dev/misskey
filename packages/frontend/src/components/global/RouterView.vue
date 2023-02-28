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
import { inject, onBeforeUnmount, provide } from 'vue';
import { Resolved, Router } from '@/nirax';
import { defaultStore } from '@/store';

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
let currentPageComponent = $shallowRef(current.route.component);
let currentPageProps = $ref(current.props);
let key = $ref(current.route.path + JSON.stringify(Object.fromEntries(current.props)));

function onChange({ resolved, key: newKey }) {
	const current = resolveNested(resolved);
	if (current == null) return;
	currentPageComponent = current.route.component;
	currentPageProps = current.props;
	key = current.route.path + JSON.stringify(Object.fromEntries(current.props));
}

router.addListener('change', onChange);

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
});
</script>
