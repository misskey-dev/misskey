<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<MkNotes :pagination="pagination" />
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkNotes from '@/components/MkNotes.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'i/favorites' as const,
	limit: 10,
};

definePageMetadata({
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
});
</script>

<style lang="scss" module>
.note {
	background: var(--panel);
	border-radius: var(--radius);
}
</style>
