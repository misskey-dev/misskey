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
import { noteManager } from '@/scripts/entity-manager';
import { MisskeyEntity } from '@/types/date-separated-list';

const transform = (noteFavorites: any[]): MisskeyEntity[] => {
	return noteFavorites.map(noteFavorite => {
		const note = noteFavorite.note;
		noteManager.set(note);
		return {
			id: note.id,
			createdAt: note.createdAt,
		};
	});
};

const pagination = {
	endpoint: 'i/favorites' as const,
	limit: 10,
	transform,
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
