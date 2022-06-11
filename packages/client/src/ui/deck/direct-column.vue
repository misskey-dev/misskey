<template>
<XColumn :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header><i class="fas fa-envelope" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotes :pagination="pagination"/>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import XNotes from '@/components/notes.vue';
import { Column } from './deck-store';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
	params: {
		visibility: 'specified'
	},
};
</script>
