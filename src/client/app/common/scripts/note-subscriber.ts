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

		$_ns_target(): any {
			return this.$_ns_isRenote ? this.$_ns_note_.renote : this.$_ns_note_;
		},
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = (this as any).os.stream;
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
				const data = {
					id: this.$_ns_target.id
				} as any;

				if (
					(this.$_ns_target.visibleUserIds || []).includes(this.$store.state.i.id) ||
					(this.$_ns_target.mentions || []).includes(this.$store.state.i.id)
				) {
					data.read = true;
				}

				this.connection.send('sn', data);
				if (withHandler) this.connection.on('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		decapture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send('un', {
					id: this.$_ns_target.id
				});
				if (withHandler) this.connection.off('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		onStreamConnected() {
			this.capture();
		},

		onStreamNoteUpdated(data) {
			const { type, id, body } = data;

			if (id !== this.$_ns_target.id) return;

			switch (type) {
				case 'reacted': {
					const reaction = body.reaction;

					if (this.$_ns_target.reactionCounts == null) {
						Vue.set(this.$_ns_target, 'reactionCounts', {});
					}

					if (this.$_ns_target.reactionCounts[reaction] == null) {
						Vue.set(this.$_ns_target.reactionCounts, reaction, 0);
					}

					this.$_ns_target.reactionCounts[reaction]++;

					if (body.userId == this.$store.state.i.id) {
						Vue.set(this.$_ns_target, 'myReaction', reaction);
					}
					break;
				}

				case 'pollVoted': {
					if (body.userId == this.$store.state.i.id) return;
					const choice = body.choice;
					this.$_ns_target.poll.choices.find(c => c.id === choice).votes++;
					break;
				}

				case 'deleted': {
					Vue.set(this.$_ns_target, 'deletedAt', body.deletedAt);
					this.$_ns_target.text = null;
					this.$_ns_target.tags = [];
					this.$_ns_target.fileIds = [];
					this.$_ns_target.poll = null;
					this.$_ns_target.geo = null;
					this.$_ns_target.cw = null;
					break;
				}
			}

			this.$emit(`update:${prop}`, this.$_ns_note_);
		},
	}
});
