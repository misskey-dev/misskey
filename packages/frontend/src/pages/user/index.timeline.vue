<template>
<MkSpacer :content-max="800">
	<XNotes :no-gap="true" :pagination="pagination" :class="$style.tl"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import XNotes from '@/components/MkNotes.vue';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
	tab: 'notes' | 'replies' | 'files';
}>();

const pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
		includeReplies: props.tab === 'replies',
		withFiles: props.tab === 'files',
	})),
};
</script>

<style lang="scss" module>
.tl {
	background: var(--bg);
    border-radius: var(--radius);
    overflow: clip;
}
</style>
