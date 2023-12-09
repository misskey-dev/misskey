<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="500"
	:initialHeight="500"
	:canResize="true"
	:closeButton="true"
	:buttonsLeft="buttonsLeft"
	:buttonsRight="buttonsRight"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata?.value">
			<i v-if="pageMetadata.value.icon" :class="pageMetadata.value.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.value.title }}</span>
		</template>
	</template>

	<div ref="contents" :class="$style.root" style="container-type: inline-size;">
		<RouterView :key="reloadCount" :router="router"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { ComputedRef, onMounted, onUnmounted, provide, shallowRef, ref, computed } from 'vue';
import RouterView from '@/components/global/RouterView.vue';
import MkWindow from '@/components/MkWindow.vue';
import { popout as _popout } from '@/scripts/popout.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { url } from '@/config.js';
import { mainRouter, routes, page } from '@/router.js';
import { $i } from '@/account.js';
import { Router, useScrollPositionManager } from '@/nirax';
import { i18n } from '@/i18n.js';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata.js';
import { openingWindowsCount } from '@/os.js';
import { claimAchievement } from '@/scripts/achievements.js';
import { getScrollContainer } from '@/scripts/scroll.js';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
}>();

const router = new Router(routes, props.initialPath, !!$i, page(() => import('@/pages/not-found.vue')));

const contents = shallowRef<HTMLElement>();
const pageMetadata = ref<null | ComputedRef<PageMetadata>>();
const windowEl = shallowRef<InstanceType<typeof MkWindow>>();
const history = ref<{ path: string; key: any; }[]>([{
	path: router.getCurrentPath(),
	key: router.getCurrentKey(),
}]);
const buttonsLeft = computed(() => {
	const buttons = [];

	if (history.value.length > 1) {
		buttons.push({
			icon: 'ti ti-arrow-left',
			onClick: back,
		});
	}

	return buttons;
});
const buttonsRight = computed(() => {
	const buttons = [{
		icon: 'ti ti-reload',
		title: i18n.ts.reload,
		onClick: reload,
	}, {
		icon: 'ti ti-player-eject',
		title: i18n.ts.showInPage,
		onClick: expand,
	}];

	return buttons;
});
const reloadCount = ref(0);

router.addListener('push', ctx => {
	history.value.push({ path: ctx.path, key: ctx.key });
});

provide('router', router);
provideMetadataReceiver((info) => {
	pageMetadata.value = info;
});
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);
provide('forceSpacerMin', true);

const contextmenu = computed(() => ([{
	icon: 'ti ti-player-eject',
	text: i18n.ts.showInPage,
	action: expand,
}, {
	icon: 'ti ti-window-maximize',
	text: i18n.ts.popout,
	action: popout,
}, {
	icon: 'ti ti-external-link',
	text: i18n.ts.openInNewTab,
	action: () => {
		window.open(url + router.getCurrentPath(), '_blank', 'noopener');
		windowEl.value.close();
	},
}, {
	icon: 'ti ti-link',
	text: i18n.ts.copyLink,
	action: () => {
		copyToClipboard(url + router.getCurrentPath());
	},
}]));

function back() {
	history.value.pop();
	router.replace(history.value.at(-1)!.path, history.value.at(-1)!.key);
}

function reload() {
	reloadCount.value++;
}

function close() {
	windowEl.value.close();
}

function expand() {
	mainRouter.push(router.getCurrentPath(), 'forcePage');
	windowEl.value.close();
}

function popout() {
	_popout(router.getCurrentPath(), windowEl.value.$el);
	windowEl.value.close();
}

useScrollPositionManager(() => getScrollContainer(contents.value), router);

onMounted(() => {
	openingWindowsCount.value++;
	if (openingWindowsCount.value >= 3) {
		claimAchievement('open3windows');
	}
});

onUnmounted(() => {
	openingWindowsCount.value--;
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	overscroll-behavior: contain;

	min-height: 100%;
	background: var(--bg);

	--margin: var(--marginHalf);
}
</style>
