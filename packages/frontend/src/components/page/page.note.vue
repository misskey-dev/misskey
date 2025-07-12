<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<template v-for="appearNote in interruptNotes(note == null ? [] : [note])" :key="appearNote.id">
		<MkNote v-if="!block.detailed" :key="appearNote.id + ':normal'" :note="appearNote"/>
		<MkNoteDetailed v-if="block.detailed" :key="appearNote.id + ':detail'" :note="appearNote"/>
	</template>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNote from '@/components/MkNote.vue';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useInterruptNotes } from '@/composables/use-interrupt-notes';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const interruptNotes = useInterruptNotes('');

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
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
}
</style>
