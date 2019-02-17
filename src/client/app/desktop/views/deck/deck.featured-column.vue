<template>
<x-column>
	<span slot="header">
		<fa :icon="faNewspaper"/>{{ $t('@.featured-notes') }}
	</span>

	<div>
		<x-notes ref="timeline" :more="null"/>
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
			fetching: true,
			faNewspaper
		};
	},

	mounted() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('notes/featured', {
					limit: 20,
				}).then(notes => {
					notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
