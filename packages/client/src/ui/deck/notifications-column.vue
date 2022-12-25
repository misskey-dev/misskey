<template>
<XColumn :column="column" :is-stacked="isStacked" :menu="menu" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications :include-types="column.includingTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import XNotifications from '@/components/MkNotifications.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

function func() {
	os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSettingWindow.vue')), {
		includingTypes: props.column.includingTypes,
	}, {
		done: async (res) => {
			const { includingTypes } = res;
			updateColumn(props.column.id, {
				includingTypes: includingTypes,
			});
		},
	}, 'closed');
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.notificationSetting,
	action: func,
}];
</script>
