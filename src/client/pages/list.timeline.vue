<template>
<x-notes ref="timeline" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from '../components/notes.vue';

export default Vue.extend({
	components: {
		XNotes
	},

	props: {
		list: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			connection: null,
			date: null,
			pagination: {
				endpoint: 'notes/user-list-timeline',
				limit: 10,
				params: init => ({
					listId: this.list.id,
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				})
			}
		};
	},

	watch: {
		list: 'init'
	},

	mounted() {
		this.init();

		this.$root.$on('warp', this.warp);
		this.$once('hook:beforeDestroy', () => {
			this.$root.$off('warp', this.warp);
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		init() {
			if (this.connection) this.connection.dispose();
			this.connection = this.$root.stream.connectToChannel('userList', {
				listId: this.list.id
			});
			this.connection.on('note', this.onNote);
			this.connection.on('userAdded', this.onUserAdded);
			this.connection.on('userRemoved', this.onUserRemoved);
		},

		onNote(note) {
			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		},

		onUserAdded() {
			(this.$refs.timeline as any).reload();
		},

		onUserRemoved() {
			(this.$refs.timeline as any).reload();
		},

		warp(date) {
			this.date = date;
			(this.$refs.timeline as any).reload();
		}
	}
});
</script>
