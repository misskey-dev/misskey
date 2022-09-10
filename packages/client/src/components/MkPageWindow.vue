<template>
<XWindow
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

	<div class="yrolvcoq" :style="{ background: pageMetadata?.value?.bg }">
		<RouterView :router="router"/>
	</div>
</XWindow>
</template>

<script lang="ts" setup>
import { ComputedRef, inject, provide } from 'vue';
import RouterView from '@/components/global/RouterView.vue';
import XWindow from '@/components/MkWindow.vue';
import { popout as _popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import * as os from '@/os';
import { mainRouter, routes } from '@/router';
import { Router } from '@/nirax';
import { i18n } from '@/i18n';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
}>();

const router = new Router(routes, props.initialPath);

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let windowEl = $ref<InstanceType<typeof XWindow>>();
const history = $ref<{ path: string; key: any; }[]>([{
	path: router.getCurrentPath(),
	key: router.getCurrentKey(),
}]);
const buttonsLeft = $computed(() => {
	const buttons = [];

	if (history.length > 1) {
		buttons.push({
			icon: 'fas fa-arrow-left',
			onClick: back,
		});
	}

	return buttons;
});
const buttonsRight = $computed(() => {
	const buttons = [{
		icon: 'fas fa-expand-alt',
		title: i18n.ts.showInPage,
		onClick: expand,
	}];

	return buttons;
});

router.addListener('push', ctx => {
	history.push({ path: ctx.path, key: ctx.key });
});

provide('router', router);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);

const contextmenu = $computed(() => ([{
	icon: 'fas fa-expand-alt',
	text: i18n.ts.showInPage,
	action: expand,
}, {
	icon: 'fas fa-external-link-alt',
	text: i18n.ts.popout,
	action: popout,
}, {
	icon: 'fas fa-external-link-alt',
	text: i18n.ts.openInNewTab,
	action: () => {
		window.open(url + router.getCurrentPath(), '_blank');
		windowEl.close();
	},
}, {
	icon: 'fas fa-link',
	text: i18n.ts.copyLink,
	action: () => {
		copyToClipboard(url + router.getCurrentPath());
	},
}]));

function menu(ev) {
	os.popupMenu(contextmenu, ev.currentTarget ?? ev.target);
}

function back() {
	history.pop();
	router.replace(history[history.length - 1].path, history[history.length - 1].key);
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

defineExpose({
	close,
});
</script>

<style lang="scss" scoped>
.yrolvcoq {
	min-height: 100%;
	background: var(--bg);
}
</style>
