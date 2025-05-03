<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad" :pullToRefresh="pullToRefresh">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" draggable="false"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root, { [$style.noGap]: noGap, '_gaps': !noGap }]">
			<template v-for="(note, i) in notes" :key="note.id">
				<div v-if="note._shouldInsertAd_" :class="[$style.noteWithAd, { '_gaps': !noGap }]" :data-scroll-anchor="note.id">
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
					<div :class="$style.ad">
						<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					</div>
				</div>
				<MkNote v-else :class="$style.note" :note="note" :withHardMute="true" :data-scroll-anchor="note.id"/>
			</template>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import type { PagingCtx } from '@/use/use-pagination.js';
import MkNote from '@/components/MkNote.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { globalEvents, useGlobalEvent } from '@/events.js';

const props = withDefaults(defineProps<{
	pagination: PagingCtx;
	noGap?: boolean;
	disableAutoLoad?: boolean;
	pullToRefresh?: boolean;
}>(), {
	pullToRefresh: true,
});

const pagingComponent = useTemplateRef('pagingComponent');

useGlobalEvent('noteDeleted', (noteId) => {
	pagingComponent.value?.paginator.removeItem(noteId);
});

function reload() {
	return pagingComponent.value?.paginator.reload();
}

defineExpose({
	reload,
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;

	&.noGap {
		background: var(--MI_THEME-panel);

		.note {
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}

		.ad {
			padding: 8px;
			background-size: auto auto;
			background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--MI_THEME-bg) 8px, var(--MI_THEME-bg) 14px);
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}
	}

	&:not(.noGap) {
		background: var(--MI_THEME-bg);

		.note {
			background: var(--MI_THEME-panel);
			border-radius: var(--MI-radius);
		}
	}
}

.ad:empty {
	display: none;
}
</style>
