<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :paginator="paginator">
	<template #empty><MkResult type="empty" :text="i18n.ts.noUsers"/></template>

	<template #default="{ items }">
		<div :class="$style.root">
			<MkUserInfo v-for="item in items" :key="item.id" :user="extractor(item)"/>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="P extends IPaginator">
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import type { ExtractorFunction, IPaginator } from '@/utility/paginator.js';
import MkPagination from '@/components/MkPagination.vue';
import MkUserInfo from '@/components/MkUserInfo.vue';

const props = withDefaults(defineProps<{
	paginator: P;
	noGap?: boolean;
	extractor?: ExtractorFunction<P, Misskey.entities.UserDetailed>;
}>(), {
	extractor: (item) => item,
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}
</style>
