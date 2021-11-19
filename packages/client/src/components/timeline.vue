<template>
<XNotes ref="tl" :no-gap="!$store.state.showGapBetweenNotesInTimeline" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)" @queue="$emit('queue', $event)"/>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import XNotes from './notes.vue';
import * as os from '@/os';
import * as sound from '@/scripts/sound';

export default defineComponent({
	components: {
		XNotes
	},

	provide() {
		return {
			inChannel: this.src === 'channel'
		};
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
		channel: {
			type: String,
			required: false
		},
		sound: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['note', 'queue', 'before', 'after'],

	data() {
		return {
			connection: null,
			connection2: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.showLocalRenotes
			},
			query: {},
			date: null
		};
	},

	created() {
		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			if (this.sound) {
				sound.play(note.userId === this.$i.id ? 'noteMy' : 'note');
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
			this.connection = markRaw(os.stream.useChannel('antenna', {
				antennaId: this.antenna
			}));
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = markRaw(os.stream.useChannel('homeTimeline'));
			this.connection.on('note', prepend);

			this.connection2 = markRaw(os.stream.useChannel('main'));
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			endpoint = 'notes/local-timeline';
			this.connection = markRaw(os.stream.useChannel('localTimeline'));
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = markRaw(os.stream.useChannel('hybridTimeline'));
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = markRaw(os.stream.useChannel('globalTimeline'));
			this.connection.on('note', prepend);
		} else if (this.src == 'mentions') {
			endpoint = 'notes/mentions';
			this.connection = markRaw(os.stream.useChannel('main'));
			this.connection.on('mention', prepend);
		} else if (this.src == 'directs') {
			endpoint = 'notes/mentions';
			this.query = {
				visibility: 'specified'
			};
			const onNote = note => {
				if (note.visibility == 'specified') {
					prepend(note);
				}
			};
			this.connection = markRaw(os.stream.useChannel('main'));
			this.connection.on('mention', onNote);
		} else if (this.src == 'list') {
			endpoint = 'notes/user-list-timeline';
			this.query = {
				listId: this.list
			};
			this.connection = markRaw(os.stream.useChannel('userList', {
				listId: this.list
			}));
			this.connection.on('note', prepend);
			this.connection.on('userAdded', onUserAdded);
			this.connection.on('userRemoved', onUserRemoved);
		} else if (this.src == 'channel') {
			endpoint = 'channels/timeline';
			this.query = {
				channelId: this.channel
			};
			this.connection = markRaw(os.stream.useChannel('channel', {
				channelId: this.channel
			}));
			this.connection.on('note', prepend);
		}

		this.pagination = {
			endpoint: endpoint,
			limit: 10,
			params: init => ({
				untilDate: this.date?.getTime(),
				...this.baseQuery, ...this.query
			})
		};
	},

	beforeUnmount() {
		this.connection.dispose();
		if (this.connection2) this.connection2.dispose();
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		},

		timetravel(date?: Date) {
			this.date = date;
			this.$refs.tl.reload();
		}
	}
});
</script>
