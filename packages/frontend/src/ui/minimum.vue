<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div style="container-type: inline-size;">
		<RouterView/>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef, ref } from 'vue';
import XCommon from './_common_/common.vue';
import { mainRouter } from '@/router.js';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata.js';
import { instanceName } from '@/config.js';

const pageMetadata = ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata.value = info;
	if (pageMetadata.value.value) {
		document.title = `${pageMetadata.value.value.title} | ${instanceName}`;
	}
});

document.documentElement.style.overflowY = 'scroll';
</script>

<style lang="scss" module>
.root {
	min-height: 100dvh;
	box-sizing: border-box;
}
</style>
