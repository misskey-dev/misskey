<template>
<x-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './deck.notes.vue';

export default Vue.extend({
	components: {
		XNotes
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
				params: init => ({
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				})
			}
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
