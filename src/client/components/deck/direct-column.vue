<template>
<x-column :name="name" :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faEnvelope" style="margin-right: 8px;"/>{{ column.name }}</template>

	<x-direct/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XDirect from '../../pages/messages.vue';

export default defineComponent({
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
			faEnvelope
		}
	},
});
</script>
