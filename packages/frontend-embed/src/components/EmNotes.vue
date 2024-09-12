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
			<EmNote v-for="note in notes" :key="note.id" :class="$style.note" :note="note"/>
		</div>
	</template>
</EmPagination>
</template>

<script lang="ts" setup generic="EP extends FilteredEndpointsByResType<Misskey.Endpoints, Array<Misskey.entities.Note>>">
import * as Misskey from 'misskey-js';
import { useTemplateRef } from 'vue';
import EmNote from '@/components/EmNote.vue';
import EmPagination, { Paging, FilteredEndpointsByResType } from '@/components/EmPagination.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	pagination: Paging<EP>;
	noGap?: boolean;
	disableAutoLoad?: boolean;
}>();

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
