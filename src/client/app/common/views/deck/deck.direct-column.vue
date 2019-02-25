<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<template #header><fa :icon="['far', 'envelope']"/>{{ name }}</template>

	<x-direct/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XDirect from './deck.direct.vue';

export default Vue.extend({
	i18n: i18n(),
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
			return this.$t('@deck.direct');
		}
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		}
	}
});
</script>
