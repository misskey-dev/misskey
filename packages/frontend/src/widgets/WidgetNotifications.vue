<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" data-cy-mkw-notifications class="mkw-notifications">
	<template #icon><i class="ti ti-bell"></i></template>
	<template #header>{{ i18n.ts.notifications }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configureNotification()"><i class="ti ti-settings"></i></button></template>

	<div>
		<MkStreamingNotificationsTimeline :excludeTypes="widgetProps.excludeTypes"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { notificationTypes as notificationTypes_typeReferenceOnly } from 'misskey-js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkStreamingNotificationsTimeline from '@/components/MkStreamingNotificationsTimeline.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const name = 'notifications';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	height: {
		type: 'number',
		label: i18n.ts.height,
		default: 300,
	},
	excludeTypes: {
		type: 'array',
		hidden: true,
		default: [] as (typeof notificationTypes_typeReferenceOnly[number])[],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const configureNotification = async () => {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: widgetProps.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			widgetProps.excludeTypes = excludeTypes;
			save();
		},
		closed: () => dispose(),
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
