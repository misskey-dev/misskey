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
			title: this.$t('searchWith', { q: this.$route.query.q })
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/search',
				limit: 10,
				params: () => ({
					query: this.$route.query.q,
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
