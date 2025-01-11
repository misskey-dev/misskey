<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<MkPagination :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.noNotes }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<MkDateSeparatedList v-slot="{ item }" :items="items" :direction="'down'" :noGap="false" :ad="false">
					<MkNote :key="item.id" :note="item.note" :class="$style.note"/>
				</MkDateSeparatedList>
			</template>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { infoImageUrl } from '@/instance.js';

const pagination = {
	endpoint: 'i/favorites' as const,
	limit: 10,
};

definePageMetadata(() => ({
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
}));
</script>

<style lang="scss" module>
.note {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}
</style>
