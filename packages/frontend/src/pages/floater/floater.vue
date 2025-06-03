<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkPagination
		v-slot="{ items, fetching }" ref="paginationComponent" :pagination="followingPagination"
		:class="$style.tl"
	>
		<div :class="$style.content">
			<MkLoading v-if="fetching && items.length === 0"/>
			<MkResult v-else-if="items.length === 0" type="empty"/>

			<!-- ユーザーごとのノートグループ（元のソート順を維持） -->
			<div v-for="item in items" :key="item.id" :class="$style.userNotes">
				<!-- ノートごとに日付線を表示（ノート自体のソート順は変更しない） -->
				<template v-for="(note, i) in item.notes" :key="note.id">
					<!-- 日付が変わる場合または最初のノートの場合に日付線を表示（ただし今日の日付は表示しない） -->
					<div
						v-if="(i === 0 || !isSameDay(note.createdAt, item.notes[i - 1].createdAt)) && !isToday(note.createdAt)"
						:class="[$style.dateSeparator, i === 0 ? $style.firstDateSeparator : '']"
					>
						<span>{{ getDateText(new Date(note.createdAt)) }}</span>
					</div>

					<!-- 通常のノート表示 -->
					<MkNote :note="note" :class="$style.note" :withHardMute="true" :ignoreInheritedHardMute="false"/>
				</template>
			</div>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, provide } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { getDateText } from '@/utility/timeline-date-separate.js';

provide('inTimeline', true);

// propsをシンプル化
const props = defineProps<{
	anchorDate: number;
}>();

// MkPaginationコンポーネントへの参照
const paginationComponent = shallowRef(null);

// ページネーションの設定
const followingPagination = computed(() => ({
	endpoint: 'notes/floater' as const,
	limit: 10,
	offsetMode: true,
	params: {
		anchorDate: props.anchorDate,
	},
}));

// 同じ日付かどうかを判定する関数
function isSameDay(date1: string, date2: string): boolean {
	const d1 = new Date(date1);
	const d2 = new Date(date2);
	return d1.getFullYear() === d2.getFullYear()
		&& d1.getMonth() === d2.getMonth()
		&& d1.getDate() === d2.getDate();
}

// 今日の日付かどうかを判定する関数
function isToday(dateStr: string): boolean {
	const date = new Date(dateStr);
	const today = new Date();
	return date.getFullYear() === today.getFullYear()
		&& date.getMonth() === today.getMonth()
		&& date.getDate() === today.getDate();
}

// 必要に応じて外部からリロードできるように
function reload() {
	if (paginationComponent.value) {
		paginationComponent.value.paginator.reload();
	}
}

defineExpose({
	reload,
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

			.dateSeparator {
				position: relative;
				text-align: center;
				padding: 8px 0;
				color: var(--MI_THEME-fgOnX);
				border-top: solid 0.5px var(--MI_THEME-divider);
				border-bottom: solid 0.5px var(--MI_THEME-divider);
				margin: 0;
				background: var(--MI_THEME-panel);

				span {
					display: inline-block;
					position: relative;
					padding: 0 16px;
					font-size: 0.9em;
					line-height: 1.5em;
					font-weight: 500;
				}
			}

			// ノートグループの最初に表示される日付線の特別スタイル
			.firstDateSeparator {
				border-top: none;
				border-top-left-radius: var(--MI-radius);
				border-top-right-radius: var(--MI-radius);
			}

			.note {
				border-bottom: solid 0.5px var(--MI_THEME-divider);

				&:last-child {
					border-bottom: none;
					border-bottom-left-radius: var(--MI-radius);
					border-bottom-right-radius: var(--MI-radius);
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
