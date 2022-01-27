<template>
<div class="_section">
	<XNotes class="_content" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';

const props = defineProps<{
	tag: string;
}>();

const pagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: props.tag,
		icon: 'fas fa-hashtag',
		bg: 'var(--bg)',
	})),
});
</script>
