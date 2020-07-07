<template>
<x-column :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faAt" style="margin-right: 8px;"/>{{ column.name }}</template>

	<x-mentions/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAt } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XMentions from '../../pages/mentions.vue';

export default Vue.extend({
	components: {
		XColumn,
		XMentions
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
			faAt
		}
	},
});
</script>
