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

	data() {
		return {
			connection: null,
			pagination: null,
		};
	},

	created() {
		this.$once('hook:beforeDestroy', () => {
			this.connection.dispose();
		});

		const prepend = note => {
			(this.$refs.timeline as any).prepend(note);
		};

		const onChangeFollowing = () => {
			this.fetch();
		};

		this.connection = this.$root.stream.useSharedConnection('homeTimeline');
		this.connection.on('note', prepend);
		this.connection.on('follow', onChangeFollowing);
		this.connection.on('unfollow', onChangeFollowing);

		this.pagination = {
			endpoint: 'notes/timeline',
			limit: 10,
			params: {}
		};
	}
});
</script>
