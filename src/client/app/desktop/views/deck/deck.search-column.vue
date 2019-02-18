<template>
<x-column>
	<template #header>
		<fa icon="search"/><span>{{ q }}</span>
	</template>

	<div>
		<x-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';

const limit = 20;

export default Vue.extend({
	components: {
		XColumn,
		XNotes
	},

	data() {
		return {
			makePromise: cursor => this.$root.api('notes/search', {
				limit: limit + 1,
				offset: cursor ? cursor : undefined,
				query: this.q
			}).then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: cursor ? cursor + limit : limit
					};
				} else {
					return {
						notes: notes,
						cursor: null
					};
				}
			})
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
