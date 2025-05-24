<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._fileViewer.thisPageCanBeSeenFromTheAuthor }}</MkInfo>
	<MkNotesTimeline ref="tlComponent" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import type { PagingCtx } from '@/composables/use-pagination.js';
import MkInfo from '@/components/MkInfo.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';

const props = defineProps<{
	fileId: string;
}>();

const realFileId = computed(() => props.fileId);

const pagination = ref<PagingCtx>({
	endpoint: 'drive/files/attached-notes',
	limit: 10,
	params: {
		fileId: realFileId.value,
	},
});
</script>
