<template>
<XColumn :column="column" :is-stacked="isStacked" :func="{ handler: func, title: $ts.notificationSetting }" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header><i class="fas fa-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications :include-types="column.includingTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import XColumn from './column.vue';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';
import { updateColumn } from './deck-store';
import { Column } from './deck-store';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

function func() {
	os.popup(defineAsyncComponent(() => import('@/components/notification-setting-window.vue')), {
		includingTypes: props.column.includingTypes,
	}, {
		done: async (res) => {
			const { includingTypes } = res;
			updateColumn(props.column.id, {
				includingTypes: includingTypes
			});
		},
	}, 'closed');
}
</script>
