<template>
<div class="_section">
	<XNotes ref="notes" class="_content" :pagination="pagination" @before="before" @after="after"/>
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

	props: {
		tag: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.tag,
				icon: 'fas fa-hashtag'
			},
			pagination: {
				endpoint: 'notes/search-by-tag',
				limit: 10,
				params: () => ({
					tag: this.tag,
				})
			},
		};
	},

	watch: {
		tag() {
			(this.$refs.notes as any).reload();
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
