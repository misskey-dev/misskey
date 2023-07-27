<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-at" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<MkNotes :pagination="pagination"/>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import { Column } from './deck-store';
import MkNotes from '@/components/MkNotes.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
};
</script>
