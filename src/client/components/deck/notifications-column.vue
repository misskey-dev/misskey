<template>
<x-column :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faBell" style="margin-right: 8px;"/>{{ column.name }}</template>

	<x-notifications :include-types="column.includingTypes"/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import XColumn from './column.vue';
import XNotifications from '../notifications.vue';
import * as os from '@/os';

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
			menu: null,
			faBell
		}
	},

	created() {
		this.menu = [{
			icon: faCog,
			text: this.$t('notificationSetting'),
			action: async () => {
				this.$root.new(await import('../notification-setting-window.vue'), {
					includingTypes: this.column.includingTypes,
				}).$on('ok', async ({ includingTypes }) => {
					this.$set(this.column, 'includingTypes', includingTypes);
					this.$store.commit('deviceUser/updateDeckColumn', this.column);
				});
			}
		}];
	},
});
</script>
