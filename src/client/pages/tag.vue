<template>
<x-notes ref="notes" :pagination="pagination" @before="before" @after="after"/>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../scripts/loading';
import XNotes from '../components/notes.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: '#' + this.$route.params.tag
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/search-by-tag',
				limit: 10,
				params: () => ({
					tag: this.$route.params.tag,
				})
			}
		};
	},

	watch: {
		$route() {
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
