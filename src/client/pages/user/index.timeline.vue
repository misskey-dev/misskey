<template>
<div>
	<MkTab v-model:value="with_" class="_vMargin">
		<option :value="null">{{ $ts.notes }}</option>
		<option value="replies">{{ $ts.notesAndReplies }}</option>
		<option value="files">{{ $ts.withFiles }}</option>
	</MkTab>
	<XNotes ref="timeline" class="_vMargin" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from '@client/components/notes.vue';
import MkTab from '@client/components/tab.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XNotes,
		MkTab,
	},

	props: {
		user: {
			type: Object,
			required: true,
		},
	},

	watch: {
		user() {
			this.$refs.timeline.reload();
		},

		with_() {
			this.$refs.timeline.reload();
		},
	},

	data() {
		return {
			date: null,
			with_: null,
			pagination: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.user.id,
					includeReplies: this.with_ === 'replies',
					withFiles: this.with_ === 'files',
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				})
			}
		};
	},
});
</script>
