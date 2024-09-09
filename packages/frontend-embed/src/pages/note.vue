<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.noteEmbedRoot">
	<EmLoading v-if="loading"/>
	<EmNoteDetailed v-else-if="note" :note="note"/>
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
const loading = ref(true);

// TODO: クライアント側でAPIを叩くのは二度手間なので予めHTMLに埋め込んでおく
misskeyApi('notes/show', {
	noteId: props.noteId,
}).then(res => {
	// リモートのノートは埋め込ませない
	if (res.url == null && res.uri == null) {
		note.value = res;
	}
	loading.value = false;
}).catch(err => {
	console.error(err);
	loading.value = false;
});
</script>

<style lang="scss" module>
.noteEmbedRoot {
	background-color: var(--panel);
}
</style>
