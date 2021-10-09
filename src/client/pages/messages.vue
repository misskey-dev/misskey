<template>
<div>
	<MkHeader :info="header"/>
	<div>
		<XNotes :pagination="pagination" @before="before()" @after="after()"/>
	</div>
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
				title: this.$ts.directNotes,
				icon: 'fas fa-envelope',
				bg: 'var(--bg)',
			},
			header: {
				title: this.$ts.directNotes,
				icon: 'fas fa-envelope',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
				params: () => ({
					visibility: 'specified'
				})
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
