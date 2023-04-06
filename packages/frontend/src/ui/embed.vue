<template>
<div class="mk-app" style="container-type: inline-size;">
	<component
		:is="popup.component"
		v-for="popup in popups"
		:key="popup.id"
		v-bind="popup.props"
		v-on="popup.events"
	/>
	<RouterView/>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef } from 'vue';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { instanceName } from '@/config';
import { popups } from '@/os';
import 'iframe-resizer/js/iframeResizer.contentWindow'

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

document.documentElement.style.backgroundColor = "transparent";
document.documentElement.style.maxWidth = "650px";
</script>

<style lang="scss" scoped>
.mk-app {
	max-width: 650px;
    min-width: 0;
	box-sizing: border-box;
	background-color: transparent;
}
</style>
