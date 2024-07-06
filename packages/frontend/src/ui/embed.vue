<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[
		$style.rootForEmbedPage,
		{
			[$style.rounded]: embedRounded,
			[$style.noBorder]: embedNoBorder,
		}
	]"
	:style="maxHeight > 0 ? { maxHeight: `${maxHeight}px`, '--embedMaxHeight': `${maxHeight}px` } : {}"
>
	<div
		:class="$style.routerViewContainer"
	>
		<RouterView/>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref, shallowRef, onMounted, onUnmounted, inject } from 'vue';
import XCommon from './_common_/common.vue';
import { PageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { instanceName } from '@/config.js';
import { mainRouter } from '@/router/main.js';
import { postMessageToParentWindow } from '@/scripts/post-message.js';
import { defaultEmbedParams } from '@/scripts/embed-page.js';
import type { ParsedEmbedParams } from '@/scripts/embed-page.js';

const embedParams = inject<ParsedEmbedParams>('embedParams', defaultEmbedParams);

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

//#region Embed Link Behavior
//強制的に新しいタブで開く
mainRouter.navHook = (path, flag): boolean => {
	window.open(path, '_blank', 'noopener');
	return true;
};
//#endregion

//#region Embed Style
const embedRounded = ref(embedParams.rounded);
const embedNoBorder = ref(!embedParams.border);
const maxHeight = ref(embedParams.maxHeight ?? 0);
//#endregion

//#region Embed Resizer
const rootEl = shallowRef<HTMLElement | null>(null);

let previousHeight = 0;
const resizeObserver = new ResizeObserver(async () => {
	const height = rootEl.value!.scrollHeight + (embedNoBorder.value ? 0 : 2); // border 上下1px
	if (Math.abs(previousHeight - height) < 1) return; // 1px未満の変化は無視
	postMessageToParentWindow('misskey:embed:changeHeight', {
		height: (maxHeight.value > 0 && height > maxHeight.value) ? maxHeight.value : height,
	});
	previousHeight = height;
});
onMounted(() => {
	resizeObserver.observe(rootEl.value!);
});
onUnmounted(() => {
	resizeObserver.disconnect();
});
//#endregion
</script>

<style lang="scss" module>
.rootForEmbedPage {
	box-sizing: border-box;
	border: 1px solid var(--divider);
	background-color: var(--bg);
	overflow: hidden;
	position: relative;
	height: auto;

	&.rounded {
		border-radius: var(--radius);
	}

	&.noBorder {
		border: none;
	}
}

.routerViewContainer {
	container-type: inline-size;
	max-height: var(--embedMaxHeight, none);
}
</style>
