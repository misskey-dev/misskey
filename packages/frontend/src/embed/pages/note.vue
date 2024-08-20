<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.noteEmbedRoot">
	<MkLoading v-if="loading"/>
	<EmNote v-else-if="note" :note="note"/>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { ref, provide, inject, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import EmNote from '@/embed/components/EmNote.vue';
import XNotFound from '@/pages/not-found.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useRouter } from '@/router/supplier.js';

const props = defineProps<{
	noteId: string;
}>();

function redirectIfNotEmbedPage() {
	const inEmbedPage = inject<boolean>('EMBED_PAGE', false);

	if (!inEmbedPage) {
		const router = useRouter();
		router.replace(`/notes/${props.noteId}`);
	}
}

redirectIfNotEmbedPage();

onActivated(redirectIfNotEmbedPage);

provide('EMBED_ORIGINAL_ENTITY_URL', `/notes/${props.noteId}`);

const note = ref<Misskey.entities.Note | null>(null);
const loading = ref(true);

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
