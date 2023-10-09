<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkNotes ref="tlComponent" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Paging } from '@/components/MkPagination.vue';
import MkNotes from '@/components/MkNotes.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const props = defineProps<{
	fileId: string;
}>();

const realFileId = computed(() => props.fileId);

const pagination = ref<Paging>({
	endpoint: 'notes/search-by-file-id',
	limit: 10,
	params: {
		fileId: realFileId.value,
	},
});
</script>
