<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkPagination v-slot="{ items, fetching }" ref="list" :pagination="followingPagination" :class="$style.tl">
			<div :class="$style.content">
				<MkLoading v-if="fetching && items.length === 0"/>
				<MkResult v-else-if="items.length === 0" type="empty"/>
				<div v-for="item in items" :key="item.id" :class="$style.userNotes">
					<div v-for="note in item.notes" :key="note.id">
						<MkNote :note="note" :class="$style.note" :withHardMute="true"/>
					</div>
				</div>
			</div>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, provide } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';

provide('inTimeline', true);
provide('shouldOmitHeaderTitle', true);

const props = defineProps<{
	anchorDate: number;
}>();

const list = shallowRef(null);

const followingPagination = computed(() => ({
	endpoint: 'notes/floater' as const,
	limit: 10,
	offsetMode: true,
	params: {
		anchorDate: props.anchorDate,
	},
}));

// タイトルとアイコンを指定し、shouldOmitHeaderTitleでヘッダーからタイトルを非表示に
definePage({
	title: i18n.ts.floater || 'Floater',
	icon: 'ti ti-ship',
});
</script>

<style lang="scss" module>
.tl {
	container-type: inline-size;
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;

	.content {
		container-type: inline-size;

		.userNotes {
			background: var(--MI_THEME-panel);
			border-radius: var(--MI-radius);
			margin-bottom: var(--MI-margin);

			.note {
				border-bottom: solid 0.5px var(--MI_THEME-divider);

				&:last-child {
					border-bottom: none;
				}
			}
		}
	}
}

/* モバイル対応のためのメディアクエリ */
@container (max-width: 500px) {
	.tl {
		border-radius: 0;

		.content .userNotes {
			border-radius: 0;
		}
	}
}

@container (max-width: 380px) {
	.tl {
		.content .userNotes {
			margin-bottom: 10px;

			.note {
				padding: 14px 16px;
			}
		}
	}
}

@container (max-width: 320px) {
	.tl {
		.content .userNotes {
			margin-bottom: 8px;
		}
	}
}
</style>
