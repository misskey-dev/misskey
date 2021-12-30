<template>
<div v-sticky-container class="yrzkoczt">
	<MkTab v-model="with_" class="tab">
		<option :value="null">{{ $ts.notes }}</option>
		<option value="replies">{{ $ts.notesAndReplies }}</option>
		<option value="files">{{ $ts.withFiles }}</option>
	</MkTab>
	<XNotes ref="timeline" :no-gap="true" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from '@/components/notes.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';

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

	watch: {
		user() {
			this.$refs.timeline.reload();
		},

		with_() {
			this.$refs.timeline.reload();
		},
	},
});
</script>

<style lang="scss" scoped>
.yrzkoczt {
	> .tab {
		margin: calc(var(--margin) / 2) 0;
		padding: calc(var(--margin) / 2) 0;
		background: var(--bg);
	}
}
</style>
