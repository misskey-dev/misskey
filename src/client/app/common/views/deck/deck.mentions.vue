<template>
<x-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './deck.notes.vue';

const fetchLimit = 10;

export default Vue.extend({
	components: {
		XNotes
	},

	data() {
		return {
			connection: null,
			makePromise: cursor => this.$root.api('notes/mentions', {
				limit: fetchLimit + 1,
				untilId: cursor ? cursor : undefined,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: notes[notes.length - 1].id
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

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('main');
		this.connection.on('mention', this.onNote);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			(this.$refs.timeline as any).prepend(note);
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
