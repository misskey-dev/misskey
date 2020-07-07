<template>
<x-column :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faBell"/>{{ column.name }}</template>

	<x-notifications/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import XColumn from './column.vue';
import XNotifications from '../../pages/notifications.vue';

export default Vue.extend({
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
			this.$store.commit('updateDeckColumn', this.column);
		}

		this.menu = [{
			icon: 'cog',
			text: this.$t('@.notification-type'),
			action: () => {
				this.$root.dialog({
					title: this.$t('@.notification-type'),
					type: null,
					select: {
						items: ['all', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest'].map(x => ({
							value: x, text: this.$t('@.notification-types.' + x)
						}))
						default: this.column.notificationType,
					},
					showCancelButton: true
				}).then(({ canceled, result: type }) => {
					if (canceled) return;
					this.column.notificationType = type;
					this.$store.commit('updateDeckColumn', this.column);
				});
			}
		}];
	},
});
</script>
