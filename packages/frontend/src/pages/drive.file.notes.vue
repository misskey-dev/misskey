<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._fileViewer.thisPageCanBeSeenFromTheAuthor }}</MkInfo>
	<MkNotesTimeline :paginator="paginator"/>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import { i18n } from '@/i18n.js';
import MkInfo from '@/components/MkInfo.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	fileId: string;
}>();

const realFileId = computed(() => props.fileId);

const paginator = markRaw(new Paginator('drive/files/attached-notes', {
	limit: 10,
	params: {
		fileId: realFileId.value,
	},
}));
</script>
