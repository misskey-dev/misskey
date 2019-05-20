<template>
<mk-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['list'],

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
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				})
			}
		};
	},

	watch: {
		$route: 'init'
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
