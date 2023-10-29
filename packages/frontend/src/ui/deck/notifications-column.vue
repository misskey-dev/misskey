<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications :excludeTypes="props.column.excludeTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store.js';
import XNotifications from '@/components/MkNotifications.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

function func() {
	os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSelectWindow.vue')), {
		excludeTypes: props.column.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			updateColumn(props.column.id, {
				excludeTypes: excludeTypes,
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
