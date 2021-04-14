<template>
<div class="_section">
	<XNotes class="_content" ref="notes" :pagination="pagination" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faFireAlt } from '@fortawesome/free-solid-svg-icons';
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
				title: this.$ts.featured,
				icon: faFireAlt
			},
			pagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true
			},
			faFireAlt
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
