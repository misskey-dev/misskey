<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root, { [$style.noGap]: noGap }]">
			<MkDateSeparatedList
				ref="notes"
				v-slot="{ item: note }"
				:items="notes"
				:direction="pagination.reversed ? 'up' : 'down'"
				:reversed="pagination.reversed"
				:noGap="noGap"
				:ad="true"
				:class="$style.notes"
			>
				<MkNote :key="note.id" :class="$style.note" :note="note" :withHardMute="true"/>
			</MkDateSeparatedList>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="EP extends FilteredEndpointsByResType<Misskey.Endpoints, Array<Misskey.entities.Note>>">
import { useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { FilteredEndpointsByResType } from '@/types/date-separated-list.js';
import MkNote from '@/components/MkNote.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';

const props = defineProps<{
	pagination: Paging<EP>;
	noGap?: boolean;
	disableAutoLoad?: boolean;
}>();

const paging = useTemplateRef('pagingComponent');

defineExpose({
	pagingComponent: paging,
});
</script>

<style lang="scss" module>
.root {
	&.noGap {
		> .notes {
			background: var(--panel);
		}
	}

	&:not(.noGap) {
		> .notes {
			background: var(--bg);

			.note {
				background: var(--panel);
				border-radius: var(--radius);
			}
		}
	}
}
</style>
