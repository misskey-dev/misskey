<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<Mfm :text="block.text ?? ''" :isNote="false"/>
	<MkUrlPreview v-for="url in urls" :key="url" :url="url"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm.js';

const MkUrlPreview = defineAsyncComponent(() => import('@/components/MkUrlPreview.vue'));

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const urls = props.block.text ? extractUrlFromMfm(mfm.parse(props.block.text)) : [];
</script>
