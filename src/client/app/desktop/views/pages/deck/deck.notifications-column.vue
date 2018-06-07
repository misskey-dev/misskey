<template>
<x-column :name="name" :column="column" :is-stacked="isStacked" :is-active="isActive">
	<span slot="header">%fa:bell R%{{ name }}</span>

	<x-notifications/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotifications from './deck.notifications.vue';

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
		},
		isActive: {
			type: Boolean,
			required: true
		}
	},

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return '%i18n:common.deck.notifications%';
		}
	},
});
</script>
