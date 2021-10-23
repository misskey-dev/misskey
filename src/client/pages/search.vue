<template>
<div class="_section">
	<div class="_content">
		<XNotes ref="notes" :pagination="pagination" @before="before" @after="after"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
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
				title: computed(() => this.$t('searchWith', { q: this.$route.query.q })),
				icon: 'fas fa-search',
			},
			pagination: {
				endpoint: 'notes/search',
				limit: 10,
				params: () => ({
					query: this.$route.query.q,
					channelId: this.$route.query.channel,
				})
			},
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
