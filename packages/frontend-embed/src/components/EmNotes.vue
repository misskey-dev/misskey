<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<EmPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root]">
			<EmNote v-for="note in notes" :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note"/>
		</div>
	</template>
</EmPagination>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import EmNote from '@/components/EmNote.vue';
import EmPagination, { Paging } from '@/components/EmPagination.vue';
import { i18n } from '@/i18n.js';

withDefaults(defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
	ad?: boolean;
}>(), {
	ad: true,
});

const pagingComponent = useTemplateRef('pagingComponent');

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	background: var(--panel);
}

.note {
	border-bottom: 0.5px solid var(--divider);
}
</style>
