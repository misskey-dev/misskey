<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad" :pullToRefresh="pullToRefresh">
	<template #empty><MkResult type="empty" :text="i18n.ts.noNotes"/></template>

	<template #default="{ items: notes }">
		<div :class="[$style.root, { [$style.noGap]: noGap, '_gaps': !noGap }]">
			<template v-for="(note, i) in notes" :key="note.id">
				<div v-if="i > 0 && isSeparatorNeeded(pagingComponent.paginator.items.value[i -1].createdAt, note.createdAt)" :data-scroll-anchor="note.id">
					<div :class="$style.date">
						<span><i class="ti ti-chevron-up"></i> {{ getSeparatorInfo(pagingComponent.paginator.items.value[i -1].createdAt, note.createdAt).prevText }}</span>
						<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
						<span>{{ getSeparatorInfo(pagingComponent.paginator.items.value[i -1].createdAt, note.createdAt).nextText }} <i class="ti ti-chevron-down"></i></span>
					</div>
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
				</div>
				<div v-else-if="note._shouldInsertAd_" :class="[$style.noteWithAd, { '_gaps': !noGap }]" :data-scroll-anchor="note.id">
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

<script lang="ts" setup generic="T extends PagingCtx">
import { useTemplateRef } from 'vue';
import type { PagingCtx } from '@/composables/use-pagination.js';
import MkNote from '@/components/MkNote.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { globalEvents, useGlobalEvent } from '@/events.js';
import { isSeparatorNeeded, getSeparatorInfo } from '@/utility/timeline-date-separate.js';

const props = withDefaults(defineProps<{
	pagination: T;
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

.date {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 1em;
	opacity: 0.75;
	padding: 8px 8px;
	margin: 0 auto;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.ad:empty {
	display: none;
}
</style>
