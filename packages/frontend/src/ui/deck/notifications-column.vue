<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu" :refresher="() => notificationsComponent.reload()">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications ref="notificationsComponent" :includeTypes="column.includingTypes"/>
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

let notificationsComponent = $shallowRef<InstanceType<typeof XNotifications>>();

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
