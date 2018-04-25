<template>
	<mk-notes ref="timeline" :more="more"/>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;

export default Vue.extend({
	props: ['list'],
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			connection: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		this.connection = new UserListStream((this as any).os, (this as any).os.i, this.list.id);
		this.connection.on('note', this.onNote);
		this.connection.on('userAdded', this.onUserAdded);
		this.connection.on('userRemoved', this.onUserRemoved);

		this.fetch();
	},
	beforeDestroy() {
		this.connection.off('note', this.onNote);
		this.connection.off('userAdded', this.onUserAdded);
		this.connection.off('userRemoved', this.onUserRemoved);
		this.connection.close();
	},
	methods: {
		fetch() {
			this.fetching = true;

			(this as any).api('notes/list-timeline', {
				limit: fetchLimit + 1,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					this.existMore = true;
				}
				(this.$refs.timeline as any).init(notes);
				this.fetching = false;
				this.$emit('loaded');
			});
		},
		more() {
			this.moreFetching = true;

			(this as any).api('notes/list-timeline', {
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});
		}
	}
});
</script>
