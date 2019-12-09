import Vue from 'vue';

export default prop => ({
	data() {
		return {
			connection: null
		};
	},

	computed: {
		$_ns_note_(): any {
			return this[prop];
		},

		$_ns_isRenote(): boolean {
			return (this.$_ns_note_.renote != null &&
				this.$_ns_note_.text == null &&
				this.$_ns_note_.fileIds.length == 0 &&
				this.$_ns_note_.poll == null);
		},

		$_ns_targets(): any {
			return this.$_ns_isRenote ? [this.$_ns_note_, this.$_ns_note_.renote] : [this.$_ns_note_];
		},
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream;
		}
	},

	mounted() {
		this.capture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.on('_connected_', this.onStreamConnected);
		}
	},

	beforeDestroy() {
		this.decapture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.off('_connected_', this.onStreamConnected);
		}
	},

	methods: {
		capture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				for (const note of this.$_ns_targets) {
					const data = {
						id: note.id
					} as any;

					if (
						(note.visibleUserIds || []).includes(this.$store.state.i.id) ||
						(note.mentions || []).includes(this.$store.state.i.id)
					) {
						data.read = true;
					}

					this.connection.send('sn', data);
					if (withHandler) this.connection.on('noteUpdated', this.onStreamNoteUpdated);
				}
			}
		},

		decapture(withHandler = false) {
			for (const note of this.$_ns_targets) {
				if (this.$store.getters.isSignedIn) {
					this.connection.send('un', {
						id: note.id
					});
					if (withHandler) this.connection.off('noteUpdated', this.onStreamNoteUpdated);
				}
			}
		},

		onStreamConnected() {
			this.capture();
		},

		onStreamNoteUpdated(data) {
			const { type, id, body } = data;

			const note = this.$_ns_targets.find(note => note.id === id);
			if (!note) return;

			switch (type) {
				case 'reacted': {
					const reaction = body.reaction;

					if (note.reactions == null) {
						Vue.set(note, 'reactions', {});
					}

					if (note.reactions[reaction] == null) {
						Vue.set(note.reactions, reaction, 0);
					}

					// Increment the count
					note.reactions[reaction]++;

					if (body.userId == this.$store.state.i.id) {
						Vue.set(note, 'myReaction', reaction);
					}
					break;
				}

				case 'unreacted': {
					const reaction = body.reaction;

					if (note.reactions == null) {
						return;
					}

					if (note.reactions[reaction] == null) {
						return;
					}

					// Decrement the count
					if (note.reactions[reaction] > 0) note.reactions[reaction]--;

					if (body.userId == this.$store.state.i.id) {
						Vue.set(note, 'myReaction', null);
					}
					break;
				}

				case 'pollVoted': {
					const choice = body.choice;
					note.poll.choices[choice].votes++;
					if (body.userId == this.$store.state.i.id) {
						Vue.set(note.poll.choices[choice], 'isVoted', true);
					}
					break;
				}

				case 'deleted': {
					Vue.set(note, 'deletedAt', body.deletedAt);
					Vue.set(note, 'renote', null);
					note.text = null;
					note.fileIds = [];
					note.poll = null;
					note.geo = null;
					note.cw = null;
					break;
				}
			}
		},
	}
});
