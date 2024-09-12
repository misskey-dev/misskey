<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :pagination="pagination">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.notFound }}</div>
		</div>
	</template>

	<template #default="{ items }">
		<MkChannelPreview v-for="item in items" :key="item.id" class="_margin" :channel="extractor(item)"/>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="EP extends FilteredEndpointsByResType<Misskey.Endpoints, Array<Misskey.entities.Channel>>">
import * as Misskey from 'misskey-js';
import type { FilteredEndpointsByResType } from '@/types/date-separated-list.js';
import MkChannelPreview from '@/components/MkChannelPreview.vue';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';

const props = withDefaults(defineProps<{
	pagination: Paging<EP>;
	noGap?: boolean;
	extractor?: (item: Misskey.Endpoints[EP]['res'][number]) => Misskey.entities.Channel;
}>(), {
	extractor: (item) => item,
});
</script>
