<template>
<div class="_section">
	<XNotes class="_content" :pagination="pagination" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Progress from '@client/scripts/loading';
import XNotes from '@client/components/notes.vue';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.mentions,
				icon: 'fas fa-at'
			},
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
			},
			faAt
		};
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
