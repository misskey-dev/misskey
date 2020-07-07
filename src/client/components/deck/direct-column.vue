<template>
<x-column :name="name" :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="['far', 'bell']"/>{{ name }}</template>

	<x-direct/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './column.vue';
import XDirect from '../../pages/messages.vue';

export default Vue.extend({
	components: {
		XColumn,
		XDirect
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
