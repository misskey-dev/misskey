<template>
<div class="_section">
	<XNotes ref="notes" class="_content" :pagination="pagination" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';

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
			INFO: {
				title: this.tag,
				icon: faHashtag
			},
			pagination: {
				endpoint: 'notes/search-by-tag',
				limit: 10,
				params: () => ({
					tag: this.tag,
				})
			},
			faHashtag
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
