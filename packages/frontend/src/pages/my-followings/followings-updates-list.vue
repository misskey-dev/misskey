<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkPagination v-slot="{items}" ref="list" :pagination="followingPagination" :class="$style.root">
		<div class="_gaps_s" :class="$style.notes">
			<div v-for="item in items" :key="item.id">
				<MkNote :note="item" :class="$style.note"/>
			</div>
		</div>
	</MkPagination>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';

const props = defineProps<{
	anchorDate: number;
}>();

const followingPagination = computed((previous) => ({
	endpoint: 'notes/followings-updates' as const,
	limit: 10,
	offsetMode: true,
	params: {
		anchorDate: props.anchorDate,
	}
}));
</script>

<style lang="scss" module>
.root {
        .notes {
                background: var(--MI_THEME-bg);
 
                .note {
                        background: var(--MI_THEME-panel);
                        border-radius: var(--MI-radius);
                }
        }
}
</style>
