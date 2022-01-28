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
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.mentions,
		icon: 'fas fa-at',
		bg: 'var(--bg)',
	},
});
</script>
