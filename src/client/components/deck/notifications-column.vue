<template>
<XColumn :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><Fa :icon="faBell" style="margin-right: 8px;"/>{{ column.name }}</template>

	<XNotifications :include-types="column.includingTypes"/>
</XColumn>
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
				os.modal(await import('@/components/notification-setting-window.vue'), {
					includingTypes: this.column.includingTypes,
				}).then(async (res) => {
					if (res == null) return;
					const { includingTypes } = res;
					this.$store.commit('deviceUser/updateDeckColumn', {
						...this.column,
						includingTypes: includingTypes
					});
				});
			}
		}];
	},
});
</script>
