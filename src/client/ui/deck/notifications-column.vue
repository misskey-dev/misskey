<template>
<XColumn :column="column" :is-stacked="isStacked" :func="{ handler: func, title: $ts.notificationSetting }">
	<template #header><i class="fas fa-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications :include-types="column.includingTypes"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import XColumn from './column.vue';
import XNotifications from '@client/components/notifications.vue';
import * as os from '@client/os';
import { updateColumn } from './deck-store';

export default defineComponent({
	components: {
		XColumn,
		XNotifications
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			faBell
		}
	},

	methods: {
		func() {
			os.popup(import('@client/components/notification-setting-window.vue'), {
				includingTypes: this.column.includingTypes,
			}, {
				done: async (res) => {
					const { includingTypes } = res;
					updateColumn(this.column.id, {
						includingTypes: includingTypes
					});
				},
			}, 'closed');
		}
	}
});
</script>
