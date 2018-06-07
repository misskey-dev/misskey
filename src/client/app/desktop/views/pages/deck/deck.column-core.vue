<template>
<x-widgets-column v-if="column.type == 'widgets'" :column="column" :is-stacked="isStacked"/>
<x-notifications-column v-else-if="column.type == 'notifications'" :column="column" :is-stacked="isStacked"/>
<x-tl-column v-else-if="column.type == 'home'" :column="column" :is-stacked="isStacked"/>
<x-tl-column v-else-if="column.type == 'local'" :column="column" :is-stacked="isStacked"/>
<x-tl-column v-else-if="column.type == 'global'" :column="column" :is-stacked="isStacked"/>
<x-tl-column v-else-if="column.type == 'list'" :column="column" :is-stacked="isStacked"/>
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
		}
	}
});
</script>
