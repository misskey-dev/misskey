<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<template #header><fa :icon="['far', 'envelope']"/>{{ name }}</template>

	<x-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';

export default Vue.extend({
	i18n: i18n(),

	components: {
		XColumn,
		XNotes
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
				params: {
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes,
					visibility: 'specified'
				}
			}
		};
	},

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return this.$t('@deck.direct');
		}
	},

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('main');
		this.connection.on('mention', this.onNote);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			// Prepend a note
			if (note.visibility == 'specified') {
				(this.$refs.timeline as unknown).prepend(note);
			}
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
