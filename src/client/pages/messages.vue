<template>
<div>
	<x-notes :pagination="pagination" :detail="true" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../scripts/loading';
import XNotes from '../components/notes.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('messages') as string
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
				params: () => ({
					visibility: 'specified'
				})
			}
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
