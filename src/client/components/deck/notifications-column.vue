<template>
<x-column :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faBell" style="margin-right: 8px;"/>{{ column.name }}</template>

	<x-notifications/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import XColumn from './column.vue';
import XNotifications from '../notifications.vue';

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
		if (this.column.notificationType == null) {
			this.column.notificationType = 'all';
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		}

		this.menu = [{
			icon: faCog,
			text: this.$t('notificationType'),
			action: () => {
				this.$root.dialog({
					title: this.$t('notificationType'),
					type: null,
					select: {
						items: ['all', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest'].map(x => ({
							value: x, text: this.$t(`_notification._types.${x}`)
						}))
						default: this.column.notificationType,
					},
					showCancelButton: true
				}).then(({ canceled, result: type }) => {
					if (canceled) return;
					this.column.notificationType = type;
					this.$store.commit('deviceUser/updateDeckColumn', this.column);
				});
			}
		}];
	},
});
</script>
