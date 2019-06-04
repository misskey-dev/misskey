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

	props: {
		list: {
			type: Object,
			required: true
		},
		mediaOnly: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'notes/user-list-timeline',
				limit: 10,
				params: init => ({
					listId: this.list.id,
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
					withFiles: this.mediaOnly,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				})
			}
		};
	},

	watch: {
		mediaOnly() {
			this.$refs.timeline.reload();
		}
	},

	mounted() {
		if (this.connection) this.connection.dispose();
		this.connection = this.$root.stream.connectToChannel('userList', {
			listId: this.list.id
		});
		this.connection.on('note', this.onNote);
		this.connection.on('userAdded', this.onUserAdded);
		this.connection.on('userRemoved', this.onUserRemoved);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			if (this.mediaOnly && note.files.length == 0) return;
			(this.$refs.timeline as unknown).prepend(note);
		},

		onUserAdded() {
			this.$refs.timeline.reload();
		},

		onUserRemoved() {
			this.$refs.timeline.reload();
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
