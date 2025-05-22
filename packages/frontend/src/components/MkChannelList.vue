<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :pagination="pagination">
	<template #empty><MkResult type="empty"/></template>

	<template #default="{ items }">
		<MkChannelPreview v-for="item in items" :key="item.id" class="_margin" :channel="extractor(item)"/>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import type { PagingCtx } from '@/composables/use-pagination.js';
import MkChannelPreview from '@/components/MkChannelPreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	pagination: PagingCtx;
	noGap?: boolean;
	extractor?: (item: any) => any;
}>(), {
	extractor: (item) => item,
});
</script>
