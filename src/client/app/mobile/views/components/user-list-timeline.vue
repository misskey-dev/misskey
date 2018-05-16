<template>
<div>
	<mk-notes ref="timeline" :more="existMore ? more : null"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { UserListStream } from '../../../common/scripts/streaming/user-list';

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
		$route: 'init'
	},
	mounted() {
		this.init();
	},
	beforeDestroy() {
		this.connection.close();
	},
	methods: {
		init() {
			if (this.connection) this.connection.close();
			this.connection = new UserListStream((this as any).os, (this as any).os.i, this.list.id);
			this.connection.on('note', this.onNote);
			this.connection.on('userAdded', this.onUserAdded);
			this.connection.on('userRemoved', this.onUserRemoved);

			this.fetch();
		},
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api('notes/user-list-timeline', {
					listId: this.list.id,
					limit: fetchLimit + 1,
					includeMyRenotes: (this as any).clientSettings.showMyRenotes,
					includeRenotedMyNotes: (this as any).clientSettings.showRenotedMyNotes
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

			(this as any).api('notes/user-list-timeline', {
				listId: this.list.id,
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
				includeMyRenotes: (this as any).clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});
		},
		onNote(note) {
			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		},
		onUserAdded() {
			this.fetch();
		},
		onUserRemoved() {
			this.fetch();
		}
	}
});
</script>
