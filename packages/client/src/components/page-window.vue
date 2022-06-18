<template>
<XWindow
	ref="windowEl"
	:initial-width="500"
	:initial-height="500"
	:can-resize="true"
	:close-button="true"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata?.value">
			<i v-if="pageMetadata.value.icon" class="icon" :class="pageMetadata.value.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.value.title }}</span>
		</template>
	</template>
	<template #headerLeft>
		<button v-if="history.length > 0" v-tooltip="$ts.goBack" class="_button" @click="back()"><i class="fas fa-arrow-left"></i></button>
	</template>
	<template #headerRight>
		<button v-tooltip="$ts.showInPage" class="_button" @click="expand()"><i class="fas fa-expand-alt"></i></button>
		<button v-tooltip="$ts.popout" class="_button" @click="popout()"><i class="fas fa-external-link-alt"></i></button>
		<button class="_button" @click="menu"><i class="fas fa-ellipsis-h"></i></button>
	</template>

	<div class="yrolvcoq" :style="{ background: pageMetadata?.value?.bg }">
		<MkStickyContainer>
			<template #header><MkHeader v-if="pageMetadata?.value && !pageMetadata.value.hideHeader" :info="pageMetadata.value"/></template>
			<RouterView :router="router"/>
		</MkStickyContainer>
	</div>
</XWindow>
</template>

<script lang="ts" setup>
import { ComputedRef, inject, provide } from 'vue';
import RouterView from './global/router-view.vue';
import XWindow from '@/components/ui/window.vue';
import { popout as _popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import * as os from '@/os';
import { mainRouter, routes } from '@/router';
import { Router } from '@/nirax';
import { i18n } from '@/i18n';
import { PageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
}>();

const router = new Router(routes, props.initialPath);

router.addListener('push', ctx => {
	
});

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let windowEl = $ref<InstanceType<typeof XWindow>>();
const history = [];

provide('router', router);
provide('setPageMetadata', (info) => {
	pageMetadata = info;
});
provide('shouldHeaderThin', true);

function navigate(path, record = true) {
	if (record) history.push(router.getCurrentPath());
	router.push(path);
}

function menu(ev) {
	os.popupMenu([{
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
	}], ev.currentTarget ?? ev.target);
}

function back() {
	navigate(history.pop(), false);
}

function close() {
	windowEl.close();
}

function expand() {
	mainRouter.push(router.getCurrentPath());
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
}
</style>
