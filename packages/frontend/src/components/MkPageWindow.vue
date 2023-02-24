<template>
<MkWindow
	ref="windowEl"
	:initial-width="500"
	:initial-height="500"
	:can-resize="true"
	:close-button="true"
	:buttons-left="buttonsLeft"
	:buttons-right="buttonsRight"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata?.value">
			<i v-if="pageMetadata.value.icon" class="icon" :class="pageMetadata.value.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.value.title }}</span>
		</template>
	</template>

	<div :class="$style.root" :style="{ background: pageMetadata?.value?.bg }" style="container-type: inline-size;">
		<RouterView :key="reloadCount" :router="router"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { ComputedRef, onMounted, onUnmounted, provide } from 'vue';
import RouterView from '@/components/global/RouterView.vue';
import MkWindow from '@/components/MkWindow.vue';
import { popout as _popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { mainRouter, routes } from '@/router';
import { Router } from '@/nirax';
import { i18n } from '@/i18n';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { openingWindowsCount } from '@/os';
import { claimAchievement } from '@/scripts/achievements';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
}>();

const router = new Router(routes, props.initialPath);

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let windowEl = $shallowRef<InstanceType<typeof MkWindow>>();
const history = $ref<{ path: string; key: any; }[]>([{
	path: router.getCurrentPath(),
	key: router.getCurrentKey(),
}]);
const buttonsLeft = $computed(() => {
	const buttons = [];

	if (history.length > 1) {
		buttons.push({
			icon: 'ti ti-arrow-left',
			onClick: back,
		});
	}

	return buttons;
});
const buttonsRight = $computed(() => {
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
let reloadCount = $ref(0);

router.addListener('push', ctx => {
	history.push({ path: ctx.path, key: ctx.key });
});

provide('router', router);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);
provide('forceSpacerMin', true);

const contextmenu = $computed(() => ([{
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
		window.open(url + router.getCurrentPath(), '_blank');
		windowEl.close();
	},
}, {
	icon: 'ti ti-link',
	text: i18n.ts.copyLink,
	action: () => {
		copyToClipboard(url + router.getCurrentPath());
	},
}]));

function back() {
	history.pop();
	router.replace(history[history.length - 1].path, history[history.length - 1].key);
}

function reload() {
	reloadCount++;
}

function close() {
	windowEl.close();
}

function expand() {
	mainRouter.push(router.getCurrentPath(), 'forcePage');
	windowEl.close();
}

function popout() {
	_popout(router.getCurrentPath(), windowEl.$el);
	windowEl.close();
}

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
	min-height: 100%;
	background: var(--bg);

	--margin: var(--marginHalf);
}
</style>
