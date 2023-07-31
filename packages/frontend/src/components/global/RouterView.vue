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
import { computed, inject, onBeforeUnmount, provide, nextTick } from 'vue';
import { NiraxChangeEvent, Resolved, Router } from '@/nirax';
import { defaultStore } from '@/store';
import { getScrollContainer } from '@/scripts/scroll';

const props = defineProps<{
	router?: Router;

	/**
	 * Set any element if scroll position management needed
	 */
	scrollContainer?: HTMLElement | null;
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

const scrollContainer = computed(() => props.scrollContainer ? (getScrollContainer(props.scrollContainer) ?? document.getElementsByTagName('html')[0]) : undefined);

const scrollPosStore = new Map<string, number>();

function onChange(ctx: NiraxChangeEvent) {
	// save scroll position
	if (scrollContainer.value) scrollPosStore.set(key, scrollContainer.value.scrollTop);

	//#region change page
	const current = resolveNested(ctx.resolved);
	if (current == null) return;
	currentPageComponent = current.route.component;
	currentPageProps = current.props;
	key = current.route.path + JSON.stringify(Object.fromEntries(current.props));
	//#endregion

	//#region scroll
	nextTick(() => {
		if (!scrollContainer.value) return;

		const scrollPos = scrollPosStore.get(key) ?? 0;
		scrollContainer.value.scroll({ top: scrollPos, behavior: 'instant' });
		if (scrollPos !== 0) {
			window.setTimeout(() => { // 遷移直後はタイミングによってはコンポーネントが復元し切ってない可能性も考えられるため少し時間を空けて再度スクロール
				if (!scrollContainer.value) return;
				scrollContainer.value.scroll({ top: scrollPos, behavior: 'instant' });
			}, 100);
		}
	});
	//#endregion
}

router.addListener('change', onChange);

function onSame() {
	if (!scrollContainer.value) return;
	scrollContainer.value.scroll({ top: 0, behavior: 'smooth' });
}

router.addListener('same', onSame);

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
	router.removeListener('same', onSame);
});
</script>
