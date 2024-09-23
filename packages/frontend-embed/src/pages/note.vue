<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.noteEmbedRoot">
	<EmNoteDetailed v-if="note" :note="note"/>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmNoteDetailed from '@/components/EmNoteDetailed.vue';
import EmLoading from '@/components/EmLoading.vue';
import XNotFound from '@/pages/not-found.vue';
import { misskeyApi } from '@/misskey-api.js';

const props = defineProps<{
	noteId: string;
}>();

const note = ref<Misskey.entities.Note | null>(null);

const embedCtxEl = document.getElementById('misskey_embedCtx');
const embedCtx = (embedCtxEl && embedCtxEl.textContent) ? JSON.parse(embedCtxEl.textContent) : null;
// NOTE: devモードのときしか embedCtx が null になることは無い
note.value = embedCtx != null ? embedCtx.note : await misskeyApi('notes/show', {
	noteId: props.noteId,
});
</script>

<style lang="scss" module>
.noteEmbedRoot {
	background-color: var(--panel);
}
</style>
