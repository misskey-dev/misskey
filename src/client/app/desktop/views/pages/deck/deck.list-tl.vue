<template>
<x-notes ref="timeline" :more="existMore ? more : null" :media-view="mediaView"/>
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
		list: {
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
			fetching: true,
			moreFetching: false,
			existMore: false,
			connection: null
		};
	},

	watch: {
		mediaOnly() {
			this.fetch();
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

		this.fetch();
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('notes/user-list-timeline', {
					listId: this.list.id,
					limit: fetchLimit + 1,
					withFiles: this.mediaOnly,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		more() {
			this.moreFetching = true;

			const promise = this.$root.api('notes/user-list-timeline', {
				listId: this.list.id,
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
				withFiles: this.mediaOnly,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) {
					(this.$refs.timeline as any).append(n);
				}
				this.moreFetching = false;
			});

			return promise;
		},

		onNote(note) {
			if (this.mediaOnly && note.files.length == 0) return;

			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		},

		onUserAdded() {
			this.fetch();
		},

		onUserRemoved() {
			this.fetch();
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
