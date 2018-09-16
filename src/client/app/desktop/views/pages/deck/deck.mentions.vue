<template>
	<x-notes ref="timeline" :more="existMore ? more : null"/>
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
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			connection: null,
			connectionId: null
		};
	},

	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('mention', this.onNote);

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('mention', this.onNote);
		(this as any).os.stream.dispose(this.connectionId);
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api('notes/mentions', {
					limit: fetchLimit + 1,
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

			const promise = (this as any).api('notes/mentions', {
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
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
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		},
		onNote(note) {
			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		}
	}
});
</script>
