<template>
<x-notes ref="timeline" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from '../../components/notes.vue';

export default Vue.extend({
	components: {
		XNotes
	},

	props: {
		user: {
			type: Object,
			required: true,
		},
		withMedia: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	watch: {
		user() {
			this.$refs.timeline.reload();
		}
	},

	data() {
		return {
			date: null,
			pagination: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.user.id,
					withFiles: this.withMedia,
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				})
			}
		};
	},
});
</script>
