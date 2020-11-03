<template>
<div class="_section">
	<XNotes class="_content" :pagination="pagination" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAt } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			INFO: {
				title: this.$t('mentions'),
				icon: faAt
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
