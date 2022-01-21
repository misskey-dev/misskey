<template>
<div v-sticky-container class="yrzkoczt">
	<MkTab v-model="include" class="tab">
		<option :value="null">{{ $ts.notes }}</option>
		<option value="replies">{{ $ts.notesAndReplies }}</option>
		<option value="files">{{ $ts.withFiles }}</option>
	</MkTab>
	<XNotes :no-gap="true" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as misskey from 'misskey-js';
import XNotes from '@/components/notes.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const include = ref<string | null>(null);

const pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
		includeReplies: include.value === 'replies',
		withFiles: include.value === 'files',
	})),
};
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
