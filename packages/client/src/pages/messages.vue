<template><MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="800">
	<XNotes :pagination="pagination"/>
</MkSpacer></MkStickyContainer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
	params: {
		visibility: 'specified',
	},
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.directNotes,
	icon: 'fas fa-envelope',
	bg: 'var(--bg)',
});
</script>
