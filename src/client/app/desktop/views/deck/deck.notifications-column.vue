<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<template #header><fa :icon="['far', 'bell']"/>{{ name }}</template>

	<x-notifications/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XNotifications from './deck.notifications.vue';

export default Vue.extend({
	i18n: i18n(),
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

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return this.$t('@deck.notifications');
		}
	},
});
</script>
