<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<XNotes ref="notes" :pagination="pagination"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'notes/featured' as const,
	limit: 10,
	offsetMode: true,
};

definePageMetadata({
	title: i18n.ts.featured,
	icon: 'fas fa-fire-alt',
	bg: 'var(--bg)',
});
</script>
