<template>
<XColumn :column="column" :is-stacked="isStacked">
	<template #header><i class="fas fa-envelope" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotes :pagination="pagination"/>
</XColumn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XColumn from './column.vue';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

const props = defineProps<{
	column: Record<string, unknown>; // TODO
	isStacked: boolean;
}>();

const pagination = {
	point: 'notes/mentions' as const,
	limit: 10,
	params: computed(() => ({
		visibility: 'specified' as const,
	})),
};
</script>
