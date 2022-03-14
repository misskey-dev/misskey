<template>
<XColumn :column="column" :is-stacked="isStacked" :func="{ handler: func, title: $ts.notificationSetting }">
	<template #header><i class="fas fa-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications :include-types="column.includingTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';
import { updateColumn } from './deck-store';
import { Column } from './deck-store';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

function func() {
	os.popup(import('@/components/notification-setting-window.vue'), {
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
