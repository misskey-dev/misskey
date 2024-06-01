<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="isEmbed ? [
		$style.rootForEmbedPage,
		{
			[$style.rounded]: embedRounded,
		}
	] : [$style.root]"
>
	<div style="container-type: inline-size;">
		<RouterView/>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref, shallowRef, onMounted, onUnmounted } from 'vue';
import XCommon from './_common_/common.vue';
import { PageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { instanceName } from '@/config.js';
import { mainRouter } from '@/router/main.js';
import { isEmbedPage } from '@/scripts/embed-page.js';
import { postMessageToParentWindow } from '@/scripts/post-message';

const isEmbed = isEmbedPage();

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const pageMetadata = ref<null | PageMetadata>(null);

provide('router', mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			document.title = pageMetadata.value.title;
		} else {
			document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

//#region Embed Style
const params = new URLSearchParams(location.search);
const embedRounded = ref(params.get('rounded') !== '0');
//#endregion

//#region Embed Resizer
const rootEl = shallowRef<HTMLElement | null>(null);

if (isEmbed) {
	const resizeObserver = new ResizeObserver(async () => {
		postMessageToParentWindow('misskey:embed:changeHeight', {
			height: rootEl.value!.scrollHeight + 2, // border 上下1px
		});
	});
	onMounted(() => {
		resizeObserver.observe(rootEl.value!);
	});
	onUnmounted(() => {
		resizeObserver.disconnect();
	});
}
//#endregion

if (isEmbed) {
	document.documentElement.style.maxWidth = '500px';
	document.documentElement.classList.add('embed');
} else {
	document.documentElement.style.overflowY = 'scroll';
}
</script>

<style lang="scss" module>
.root {
	min-height: 100dvh;
	box-sizing: border-box;
}

.rootForEmbedPage {
	box-sizing: border-box;
	border: 1px solid var(--divider);
	background-color: var(--bg);
	overflow: hidden;
	position: relative;

	&.rounded {
		border-radius: var(--radius);
	}
}
</style>
