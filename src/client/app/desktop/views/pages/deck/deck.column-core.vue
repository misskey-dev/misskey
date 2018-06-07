<template>
<x-widgets-column v-if="column.type == 'widgets'"/>
<x-notifications-column v-else-if="column.type == 'notifications'"/>
<x-tl-column v-else-if="column.type == 'home'"/>
<x-tl-column v-else-if="column.type == 'local'"/>
<x-tl-column v-else-if="column.type == 'global'"/>
<x-tl-column v-else-if="column.type == 'list'"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XTlColumn from './deck.tl-column.vue';
import XNotificationsColumn from './deck.notifications-column.vue';
import XWidgetsColumn from './deck.widgets-column.vue';

export default Vue.extend({
	components: {
		XTlColumn,
		XNotificationsColumn,
		XWidgetsColumn
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: false,
			default: false
		},
		isActive: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	provide() {
		return {
			column: this.column,
			isStacked: this.isStacked,
			isActive: this.isActive
		};
	}
});
</script>
