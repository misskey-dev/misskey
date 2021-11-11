<template>
<MkSpacer :content-max="800">
	<XNotes ref="notes" :pagination="pagination" @before="before" @after="after"/>
</MkSpacer>
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
				title: this.$ts.featured,
				icon: 'fas fa-fire-alt',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true,
			},
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
