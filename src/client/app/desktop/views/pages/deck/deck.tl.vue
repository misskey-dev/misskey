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
		src: {
			type: String,
			required: false,
			default: 'home'
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

	computed: {
		stream(): any {
			switch (this.src) {
				case 'home': return this.$root.stream.useSharedConnection('homeTimeline');
				case 'local': return this.$root.stream.useSharedConnection('localTimeline');
				case 'hybrid': return this.$root.stream.useSharedConnection('hybridTimeline');
				case 'global': return this.$root.stream.useSharedConnection('globalTimeline');
			}
		},

		endpoint(): string {
			switch (this.src) {
				case 'home': return 'notes/timeline';
				case 'local': return 'notes/local-timeline';
				case 'hybrid': return 'notes/hybrid-timeline';
				case 'global': return 'notes/global-timeline';
			}
		},
	},

	watch: {
		mediaOnly() {
			this.fetch();
		}
	},

	mounted() {
		this.connection = this.stream;

		this.connection.on('note', this.onNote);
		if (this.src == 'home') {
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		}

		this.fetch();
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api(this.endpoint, {
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

			const promise = this.$root.api(this.endpoint, {
				limit: fetchLimit + 1,
				withFiles: this.mediaOnly,
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

		onChangeFollowing() {
			this.fetch();
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>
