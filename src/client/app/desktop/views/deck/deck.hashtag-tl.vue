<template>
<x-notes ref="timeline" :make-promise="makePromise" :media-view="mediaView" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './deck.notes.vue';

const fetchLimit = 10;

export default Vue.extend({
	components: {
		XNotes
	},

	props: {
		tagTl: {
			type: Object,
			required: true
		},
		mediaOnly: {
			type: Boolean,
			required: false,
			default: false
		},
		mediaView: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			connection: null,
			makePromise: cursor => this.$root.api('notes/search_by_tag', {
				limit: fetchLimit + 1,
				untilId: cursor ? cursor : undefined,
				withFiles: this.mediaOnly,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes,
				query: this.tagTl.query
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

	watch: {
		mediaOnly() {
			this.$refs.timeline.reload();
		}
	},

	mounted() {
		if (this.connection) this.connection.close();
		this.connection = this.$root.stream.connectToChannel('hashtag', {
			q: this.tagTl.query
		});
		this.connection.on('note', this.onNote);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			if (this.mediaOnly && note.files.length == 0) return;
			(this.$refs.timeline as any).prepend(note);
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
