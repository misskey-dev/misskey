<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkPagination
		v-slot="{ items: paginationItems, fetching }" ref="paginationComponent" :pagination="followingPagination"
		:class="$style.tl"
	>
		<div :class="$style.content">
			<MkLoading v-if="fetching && paginationItems.length === 0"/>
			<MkResult v-else-if="paginationItems.length === 0" type="empty"/>

			<!-- 重複排除したアイテムを使用 -->
			<div
				v-for="item in getUniqueItems(paginationItems)"
				:key="item.id"
				:class="$style.userNotes"
			>
				<!-- 最初の要素には浮上情報を表示 -->
				<div :class="[$style.dateSeparator, $style.firstDateSeparator, $style.floaterSeparator]">
					<span>{{ getCombinedFloaterInfo(item) }}</span>
				</div>

				<!-- ノート表示 -->
				<template v-for="(note, i) in item.notes" :key="note.id">
					<!-- 日付区切り (2番目以降のノートの日付変更時のみ) -->
					<div
						v-if="i > 0 && !isSameDay(note.createdAt, item.notes[i - 1].createdAt) && !isToday(note.createdAt)"
						:class="$style.dateSeparator"
					>
						<span>{{ getDateText(ensureDate(note.createdAt)) }}</span>
					</div>

					<MkNote :note="note" :class="$style.note" :withHardMute="true" :ignoreInheritedHardMute="false"/>
				</template>
			</div>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, provide, watch, ref, onMounted } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { getDateText } from '@/utility/timeline-date-separate.js';
import { i18n } from '@/i18n.js';
import { formatDateTimeString } from '@/utility/format-time-string.js';

provide('inTimeline', true);

// プロパティ定義
const props = defineProps<{
	anchorDate: number;
}>();

// 参照
const paginationComponent = shallowRef(null);
const forceReload = ref(0);

// ページネーション設定
const followingPagination = computed(() => ({
	endpoint: 'notes/floater' as const,
	limit: 10,
	offsetMode: true,
	params: {
		anchorDate: props.anchorDate,
		forceReload: forceReload.value,
	},
}));

// 初期ロード
onMounted(() => {
	if (paginationComponent.value) {
		paginationComponent.value.paginator?.reload();
	}
});

// anchorDate変更時の再ロード
watch(() => props.anchorDate, (newVal, oldVal) => {
	if (newVal !== oldVal && paginationComponent.value) {
		forceReload.value++;
		paginationComponent.value.paginator?.reload();
	}
}, { immediate: false });

// 日付変換ヘルパー関数の追加
function ensureDate(date: string | Date): Date {
	if (date instanceof Date) return date;
	try {
		return new Date(date);
	} catch (e) {
		console.error('Invalid date:', date);
		return new Date();
	}
}

// 日付判定関数
function isSameDay(date1: string | Date, date2: string | Date): boolean {
	const d1 = ensureDate(date1);
	const d2 = ensureDate(date2);
	return d1.getFullYear() === d2.getFullYear()
		&& d1.getMonth() === d2.getMonth()
		&& d1.getDate() === d2.getDate();
}

function isToday(dateStr: string | Date): boolean {
	const date = ensureDate(dateStr);
	const today = new Date();
	return date.getFullYear() === today.getFullYear()
		&& date.getMonth() === today.getMonth()
		&& date.getDate() === today.getDate();
}

// 日付と浮上情報を組み合わせた表示テキストを生成する関数
function getCombinedFloaterInfo(item: FloaterItem): string {
	// キャッシュの導入 - 同じアイテムIDには同じ結果を返す
	if (item._cachedInfo) return item._cachedInfo;

	try {
		// 最新ノートの情報から日付とユーザー名を取得
		const latestNote = item.notes[0];
		if (!latestNote) return '';

		const userName = latestNote.user.name || latestNote.user.username;
		const postDate = formatDateTimeString(ensureDate(latestNote.createdAt), 'yyyy年M月d日');
		const params = { user: userName, date: postDate };

		let messageKey: string;

		// 初投稿の場合
		if (!item.last) {
			messageKey = 'userFirstPost';
		} else {
			// 前回の投稿日時を取得
			const lastPostDate = getLastPostDate(item.last);

			if (!lastPostDate) {
				messageKey = 'userReturned';
			} else {
				// 何日ぶりかを計算
				const latestPost = ensureDate(latestNote.createdAt);
				const diffDays = calculateDaysDifference(latestPost, lastPostDate);

				if (diffDays === 0) {
					messageKey = 'userSameDay';
				} else if (diffDays === 1) {
					messageKey = 'userAfterOneDay';
				} else {
					messageKey = 'userAfterNDays';
					params.n = diffDays.toString();
				}
			}
		}

		// メッセージを生成
		const result = formatFloaterMessage(messageKey, params);

		// キャッシュに保存
		item._cachedInfo = result;
		return result;
	} catch (error) {
		console.error('Error in getCombinedFloaterInfo:', error);
		// エラー時は単純な日付表示にフォールバック
		return getDateText(ensureDate(item.notes[0]?.createdAt || new Date()));
	}
}

// IDから日付を抽出する関数を改善
function getLastPostDate(id: string): Date | null {
	if (!id || typeof id !== 'string') return null;

	try {
		// Misskeyの標準IDフォーマットを処理
		if (id.length >= 16) {
			const timestamp = parseInt(id.substring(0, 16), 16);
			// タイムスタンプの妥当性をチェック
			if (isNaN(timestamp) || timestamp <= 0) return null;
			const date = new Date(timestamp);
			// 妥当な日付かチェック
			if (date.toString() === 'Invalid Date') return null;
			return date;
		}
		return null;
	} catch (e) {
		console.error('Failed to extract date from ID:', e);
		return null;
	}
}

// リロード関数
function reload() {
	if (paginationComponent.value) {
		forceReload.value++;
		paginationComponent.value.paginator?.reload();
	}
}

// 型定義を追加
interface FloaterItem {
	id: string;
	last?: string;
	notes: Array<{
		id: string;
		createdAt: string;
		user: {
			id: string;
			name?: string;
			username: string;
		};
		// 他のノートプロパティ
	}>;
	_cachedInfo?: string; // キャッシュ用
}

// 日付計算を専門にする関数
function calculateDaysDifference(date1: Date, date2: Date): number {
	const diffTime = Math.abs(date1.getTime() - date2.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 文字列置換を一元化
function formatFloaterMessage(messageKey: string, params: Record<string, string>): string {
	let message = i18n.ts._floater[messageKey];
	Object.entries(params).forEach(([key, value]) => {
		message = message.replace(`{${key}}`, value);
	});
	return message;
}

// ユーザーIDで重複排除する関数
function getUniqueItems(items: FloaterItem[]) {
	const userMap = new Map();

	// まず重複するユーザーの投稿をマージ
	items.forEach(item => {
		if (item.notes.length > 0) {
			const userId = item.notes[0].user.id;

			if (!userMap.has(userId)) {
				userMap.set(userId, item);
			} else {
				// 既存のアイテムと新しいアイテムのノートをマージ
				const existingItem = userMap.get(userId);

				// 重複を避けるためのノートIDセット
				const existingNoteIds = new Set(existingItem.notes.map(note => note.id));

				// 新しいノートを追加（重複を避ける）
				item.notes.forEach(note => {
					if (!existingNoteIds.has(note.id)) {
						existingItem.notes.push(note);
					}
				});

				// 日付順に並べ替え
				existingItem.notes.sort((a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
			}
		}
	});

	return Array.from(userMap.values());
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

			// 共通スタイルを変数として定義
			$separator-padding: 8px 0;
			$separator-color: var(--MI_THEME-fgOnX);
			$separator-bg: var(--MI_THEME-panel);
			$separator-border: solid 0.5px var(--MI_THEME-divider);
			$border-radius: var(--MI-radius);

			// スタイル定義をDRYに
			.dateSeparator {
				position: relative;
				text-align: center;
				padding: $separator-padding;
				color: $separator-color;
				border-top: $separator-border;
				border-bottom: $separator-border;
				margin: 0;
				background: $separator-bg;

				span {
					display: inline-block;
					position: relative;
					padding: 0 16px;
					font-size: 0.9em;
					line-height: 1.5em;
					font-weight: 500;
				}

				// モディファイアとして追加
				&.floaterSeparator {
					background: var(--MI_THEME-X2);
					border-top-left-radius: $border-radius;
					border-top-right-radius: $border-radius;
					padding: 10px 0;
				}

				&.firstDateSeparator {
					border-top: none;
				}
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

			.floaterInfo {
				border-radius: 0;
			}
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
