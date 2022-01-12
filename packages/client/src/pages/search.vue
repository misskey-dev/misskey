<template>
<div class="_section">
	<div class="_content">
		<XNotes ref="notes" :pagination="pagination"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const props = defineProps<{
	query: string;
	channel?: string;
}>();

const pagination = {
	endpoint: 'notes/search' as const,
	limit: 10,
	params: computed(() => ({
		query: props.query,
		channelId: props.channel,
	}))
};

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.t('searchWith', { q: props.query }),
		icon: 'fas fa-search',
		bg: 'var(--bg)',
	})),
});
</script>
