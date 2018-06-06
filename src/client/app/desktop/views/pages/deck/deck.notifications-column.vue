<template>
<div>
	<x-column :id="column.id" :name="name">
		<span slot="header">%fa:bell R%{{ name }}</span>

		<x-notifications/>
	</x-column>
</div>
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
