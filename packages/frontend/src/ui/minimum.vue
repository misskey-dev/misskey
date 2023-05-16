<template>
<div class="mk-app" style="container-type: inline-size;">
	<RouterView/>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef } from 'vue';
import XCommon from './_common_/common.vue';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
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
	min-height: 100dvh;
	box-sizing: border-box;
}
</style>
