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
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.mentions,
	icon: 'fas fa-at',
	bg: 'var(--bg)',
});
</script>
