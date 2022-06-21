<template>
<div class="mk-app">
	<RouterView/>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef } from 'vue';
import XCommon from './_common_/common.vue';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';
import { instanceName } from '@/config';

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

document.documentElement.style.overflowY = 'scroll';
</script>

<style lang="scss" scoped>
.mk-app {
	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
}
</style>
