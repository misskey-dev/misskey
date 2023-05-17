<template>
<div class="mrdgzndn">
	<Mfm :text="block.text" :isNote="false" :i="$i"/>
	<MkUrlPreview v-for="url in urls" :key="url" :url="url" class="url"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { TextBlock } from './block.type';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import { $i } from '@/account';

const MkUrlPreview = defineAsyncComponent(() => import('@/components/MkUrlPreview.vue'));

const props = defineProps<{
	block: TextBlock,
	page: Misskey.entities.Page,
}>();

const urls = props.block.text ? extractUrlFromMfm(mfm.parse(props.block.text)) : [];
</script>

<style lang="scss" scoped>
.mrdgzndn {
	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	> .url {
		margin: 0.5em 0;
	}
}
</style>
