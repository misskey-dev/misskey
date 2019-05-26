<template>
<x-column>
	<template #header>
		<fa icon="search"/><span>{{ q }}</span>
	</template>

	<div>
		<x-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import { genSearchQuery } from '../../../common/scripts/gen-search-query';

export default Vue.extend({
	components: {
		XColumn,
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/search',
				limit: 20,
				params: () => genSearchQuery(this, this.q)
			}
		};
	},

	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},

	watch: {
		$route() {
			this.$refs.timeline.reload();
		}
	},
});
</script>
