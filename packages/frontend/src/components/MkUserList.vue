<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :pagination="pagination">
	<template #empty>
		<div class="_fullinfo">
			<img v-if="serverMetadata.infoImageUrl" :src="serverMetadata.infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noUsers }}</div>
		</div>
	</template>

	<template #default="{ items }">
		<div :class="$style.root">
			<MkUserInfo v-for="item in items" :key="item.id" class="user" :user="extractor(item)"/>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import MkUserInfo from '@/components/MkUserInfo.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';

import { DI } from '@/di.js';

const serverMetadata = inject(DI.serverMetadata)!;

const props = withDefaults(defineProps<{
	pagination: Paging;
	noGap?: boolean;
	extractor?: (item: any) => any;
}>(), {
	extractor: (item) => item,
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--margin);
}
</style>
