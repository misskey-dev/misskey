<template>
<div>
	<portal to="icon"><fa :icon="faEnvelope"/></portal>
	<portal to="title" v-t="'directNotes'"></portal>
	<x-notes :pagination="pagination" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Progress from '../scripts/loading';
import XNotes from '../components/notes.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('directNotes') as string
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
			},
			faEnvelope
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
