<template>
<x-notes ref="tl" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)" @queue="$emit('queue', $event)"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './notes.vue';

export default Vue.extend({
	components: {
		XNotes
	},

	props: {
		src: {
			type: String,
			required: true
		},
		list: {
			type: String,
			required: false
		},
		antenna: {
			type: String,
			required: false
		},
		sound: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	data() {
		return {
			connection: null,
			connection2: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			},
			query: {},
		};
	},

	created() {
		this.$once('hook:beforeDestroy', () => {
			this.connection.dispose();
			if (this.connection2) this.connection2.dispose();
		});

		const prepend = note => {
			const _note = JSON.parse(JSON.stringify(note));	// deepcopy
			(this.$refs.tl as any).prepend(_note);

			if (this.sound) {
				this.$root.sound(note.userId === this.$store.state.i.id ? 'noteMy' : 'note');
			}
		};

		const onUserAdded = () => {
			(this.$refs.tl as any).reload();
		};

		const onUserRemoved = () => {
			(this.$refs.tl as any).reload();
		};

		const onChangeFollowing = () => {
			if (!this.$refs.tl.backed) {
				this.$refs.tl.reload();
			}
		};

		let endpoint;

		if (this.src == 'antenna') {
			endpoint = 'antennas/notes';
			this.query = {
				antennaId: this.antenna
			};
			this.connection = this.$root.stream.connectToChannel('antenna', {
				antennaId: this.antenna
			});
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = this.$root.stream.useSharedConnection('homeTimeline');
			this.connection.on('note', prepend);

			this.connection2 = this.$root.stream.useSharedConnection('main');
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			endpoint = 'notes/local-timeline';
			this.connection = this.$root.stream.useSharedConnection('localTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = this.$root.stream.useSharedConnection('hybridTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = this.$root.stream.useSharedConnection('globalTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'list') {
			endpoint = 'notes/user-list-timeline';
			this.query = {
				listId: this.list
			};
			this.connection = this.$root.stream.connectToChannel('userList', {
				listId: this.list
			});
			this.connection.on('note', prepend);
			this.connection.on('userAdded', onUserAdded);
			this.connection.on('userRemoved', onUserRemoved);
		}

		this.pagination = {
			endpoint: endpoint,
			limit: 10,
			params: init => ({
				untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				...this.baseQuery, ...this.query
			})
		};
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		}
	}
});
</script>
