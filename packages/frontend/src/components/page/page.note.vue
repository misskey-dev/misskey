<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkNote v-if="note && !block.detailed" :key="note.id + ':normal'" :note="note"/>
	<MkNoteDetailed v-if="note && block.detailed" :key="note.id + ':detail'" :note="note"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNote from '@/components/MkNote.vue';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const note = ref<Misskey.entities.Note | null>(null);

onMounted(() => {
	if (props.block.note == null) return;
	misskeyApi('notes/show', { noteId: props.block.note })
		.then(result => {
			note.value = result;
		});
});
</script>

<style lang="scss" module>
.root {
	border: 1px solid var(--divider);
	border-radius: var(--radius);
}
</style>
