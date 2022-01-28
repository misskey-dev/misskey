<template>
<MkSpacer :content-max="800">
	<XNotes ref="notes" :pagination="pagination"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'notes/featured' as const,
	limit: 10,
	offsetMode: true,
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.featured,
		icon: 'fas fa-fire-alt',
		bg: 'var(--bg)',
	},
});
</script>
