<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<span slot="header">%fa:envelope R%{{ name }}</span>

	<x-direct/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XDirect from './deck.direct.vue';

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

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return '%i18n:common.deck.direct%';
		}
	},
});
</script>
