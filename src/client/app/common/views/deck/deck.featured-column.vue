<template>
<x-column>
	<template #header>
		<fa :icon="faNewspaper"/>{{ $t('@.featured-notes') }}
	</template>

	<div>
		<x-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n(),

	components: {
		XColumn,
		XNotes,
	},

	data() {
		return {
			faNewspaper,
			makePromise: cursor => this.$root.api('notes/featured', {
				limit: 20,
			}).then(notes => {
				notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				return notes;
			})
		};
	},

	methods: {
		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
