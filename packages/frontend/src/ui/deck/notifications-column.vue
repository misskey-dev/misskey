<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu" :refresher="async () => { await notificationsComponent?.reload() }">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name || i18n.ts._deck._columns.notifications }}</template>

	<MkStreamingNotificationsTimeline ref="notificationsComponent" :excludeTypes="props.column.excludeTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, useTemplateRef } from 'vue';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import { updateColumn } from '@/deck.js';
import MkStreamingNotificationsTimeline from '@/components/MkStreamingNotificationsTimeline.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

// 通知では自分がセンシティブタイムラインにした投稿の反応が表示される可能性があるため、折りたたみを無効化する
provide('collapseSensitiveChannel', false);

const notificationsComponent = useTemplateRef('notificationsComponent');

async function func() {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: props.column.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			updateColumn(props.column.id, {
				excludeTypes: excludeTypes,
			});
		},
		closed: () => dispose(),
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.notificationSetting,
	action: func,
}];
</script>
