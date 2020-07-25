<template>
<x-column :name="name" :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><fa :icon="faEnvelope" style="margin-right: 8px;"/>{{ column.name }}</template>

	<x-notes :pagination="pagination" @before="before()" @after="after()"/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Progress from '../../scripts/loading';
import XColumn from './column.vue';
import XNotes from '../notes.vue';

export default defineComponent({
	components: {
		XColumn,
		XNotes
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
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
				params: () => ({
					visibility: 'specified'
				})
			},
			faEnvelope
		}
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
});
</script>
