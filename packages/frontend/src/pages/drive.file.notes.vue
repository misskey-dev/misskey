<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._fileViewer.thisPageCanBeSeenFromTheAuthor }}</MkInfo>
	<MkNotes ref="tlComponent" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { Paging } from '@/components/MkPagination.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkNotes from '@/components/MkNotes.vue';

const props = defineProps<{
	fileId: string;
}>();

const pagination = {
	endpoint: 'drive/files/attached-notes',
	limit: 10,
	params: computed(() => ({
		fileId: props.fileId,
	})),
} as const satisfies Paging;
</script>
