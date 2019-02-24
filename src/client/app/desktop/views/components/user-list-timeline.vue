<template>
<div>
	<mk-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')">
		<template #header>
			<slot></slot>
		</template>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;

export default Vue.extend({
	props: ['list'],
	data() {
		return {
			connection: null,
			makePromise: cursor => this.$root.api('notes/user-list-timeline', {
				listId: this.list.id,
				limit: fetchLimit + 1,
				untilId: cursor ? cursor : undefined,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: notes[notes.length - 1].id
					};
				} else {
					return {
						notes: notes,
						cursor: null
					};
				}
			})
		};
	},
	watch: {
		$route: 'init'
	},
	mounted() {
		this.init();
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
			(this.$refs.timeline as any).prepend(note);
		},
		onUserAdded() {
			(this.$refs.timeline as any).reload();
		},
		onUserRemoved() {
			(this.$refs.timeline as any).reload();
		}
	}
});
</script>
