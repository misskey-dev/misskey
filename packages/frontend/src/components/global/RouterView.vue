<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_pageContainer" style="height: 100%;">
	<KeepAlive
		:max="prefer.s.numberOfPageCache"
		:exclude="pageCacheController"
	>
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
import { inject, onBeforeUnmount, provide, ref, shallowRef, computed, nextTick } from 'vue';
import type { IRouter, Resolved, RouteDef } from '@/nirax.js';
import { prefer } from '@/preferences.js';
import { globalEvents } from '@/events.js';
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

const current = router.current!;
const currentPageComponent = shallowRef('component' in current.route ? current.route.component : MkLoadingPage);
const currentPageProps = ref(current.props);
const key = ref(router.getCurrentKey() + JSON.stringify(Object.fromEntries(current.props)));

function onChange({ resolved, key: newKey }) {
	if (resolved == null || 'redirect' in resolved.route) return;
	currentPageComponent.value = resolved.route.component;
	currentPageProps.value = resolved.props;
	key.value = newKey + JSON.stringify(Object.fromEntries(resolved.props));

	nextTick(() => {
		// ページ遷移完了後に再びキャッシュを有効化
		if (clearCacheRequested.value) {
			clearCacheRequested.value = false;
		}
	});
}

router.addListener('change', onChange);

// #region キャッシュ制御

/**
	 * キャッシュクリアが有効になったら、全キャッシュをクリアする
	 *
	 * keepAlive側にwatcherがあるのですぐ消えるとはおもうけど、念のためページ遷移完了まではキャッシュを無効化しておく。
	 * キャッシュ有効時向けにexcludeを使いたい場合は、pageCacheControllerに並列に突っ込むのではなく、下に追記すること
	 */
const pageCacheController = computed(() => clearCacheRequested.value ? /.*/ : undefined);
const clearCacheRequested = ref(false);

globalEvents.on('requestClearPageCache', () => {
	if (_DEV_) console.log('clear page cache requested');
	if (!clearCacheRequested.value) {
		clearCacheRequested.value = true;
	}
});

// #endregion

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
});
</script>
