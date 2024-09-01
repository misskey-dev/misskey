<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps" :class="$style.textRoot">
	<Mfm :text="block.text ?? ''" :isNote="false"/>
	<div v-if="serverMetadata.enableUrlPreview" class="_gaps_s">
		<MkUrlPreview v-for="url in urls" :key="url" :url="url"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, inject } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm.js';

import { DI } from '@/di.js';

const serverMetadata = inject(DI.serverMetadata)!;

const MkUrlPreview = defineAsyncComponent(() => import('@/components/MkUrlPreview.vue'));

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const urls = props.block.text ? extractUrlFromMfm(mfm.parse(props.block.text)) : [];
</script>

<style lang="scss" module>
.textRoot {
	font-size: 1.1rem;
}
</style>
