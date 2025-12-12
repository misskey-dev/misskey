<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :refresher="() => reloadTimeline()">
	<template #header><i class="ti ti-at" style="margin-right: 8px;"></i>{{ column.name || i18n.ts._deck._columns.mentions }}</template>

	<MkNotesTimeline :paginator="paginator"/>
</XColumn>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import { i18n } from '@/i18n.js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { Paginator } from '@/utility/paginator.js';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const paginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
}));

function reloadTimeline() {
	return new Promise<void>((res) => {
		paginator.reload().then(() => {
			res();
		});
	});
}
</script>
