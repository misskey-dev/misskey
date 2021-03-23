<template>
<XColumn :column="column" :is-stacked="isStacked">
	<template #header><Fa :icon="faEnvelope" style="margin-right: 8px;"/>{{ column.name }}</template>

	<XNotes :pagination="pagination" @before="before()" @after="after()"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Progress from '@client/scripts/loading';
import XColumn from './column.vue';
import XNotes from '@client/components/notes.vue';
import * as os from '@client/os';

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
