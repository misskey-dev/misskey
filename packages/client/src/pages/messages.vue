<template>
<MkSpacer :content-max="800">
	<XNotes :pagination="pagination"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
	params: {
		visibility: 'specified'
	},
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.directNotes,
		icon: 'fas fa-envelope',
		bg: 'var(--bg)',
	},
});
</script>
