<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<MkNotes ref="notes" :pagination="pagination"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkNotes from '@/components/MkNotes.vue';

const props = defineProps<{
	tag: string;
}>();

const pagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};

const notes = ref<InstanceType<typeof MkNotes>>();

defineExpose({
	reload: async () => {
		await notes.value?.pagingComponent?.reload();
	},
});
</script>
