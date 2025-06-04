<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkPagination
		v-slot="{ items: paginationItems, fetching }" ref="paginationComponent"
		:pagination="followingPagination" :class="$style.tl"
	>
		<div :class="$style.content">
			<MkLoading v-if="fetching && paginationItems.length === 0"/>
			<MkResult v-else-if="paginationItems.length === 0" type="empty"/>

			<!-- 重複排除したアイテムを使用 -->
			<div v-for="item in getUniqueItems(paginationItems)" :key="item.id" :class="$style.userNotes">
				<!-- ノート表示（最大3つまで表示に変更） -->
				<template v-for="(note, i) in item.notes.slice(0, 3)" :key="note.id">
					<!-- 日付区切り: 日付が変わる場合や最初のノートに表示 -->
					<div
						v-if="shouldShowDateSeparator(note, i, item)" :class="[$style.dateSeparator,
							i === 0 ? $style.firstDateSeparator : '',
							isFloaterInfo(note, i, item) ? $style.floaterSeparator : '']"
					>
						<span>{{ getDateInfo(note, i, item) }}</span>
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

// 日付区切りを表示すべきか判断する関数
function shouldShowDateSeparator(note: any, index: number, item: FloaterItem): boolean {
	// グループ内の全てのノートが今日の日付かチェック
	const allToday = item.notes.every(n => isToday(n.createdAt));

	// 全て今日のノートなら日付区切りを表示しない
	if (allToday) return false;

	// 最初のノートには常に表示（今日だけのグループでない場合）
	if (index === 0) return true;

	// 前のノートと日付が異なる場合に表示
	return !isSameDay(note.createdAt, item.notes[index - 1].createdAt);
}

// 日付と浮上情報を組み合わせた表示テキストを生成する関数
function getCombinedFloaterInfo(item: FloaterItem, noteIndex = 0, nextNote?: any): string {
	// 最初のノート用のキャッシュはそのまま使用
	if (noteIndex === 0 && item._cachedInfo) return item._cachedInfo;

	try {
		// 表示対象のノート
		const currentNote = item.notes[noteIndex];
		if (!currentNote) return '';

		// 日付を取得
		const currentDate = ensureDate(currentNote.createdAt);

		// グループ内のノートが全て同じ日付かチェック
		const allSameDay = item.notes.length > 1 &&
      item.notes.every(n => isSameDay(n.createdAt, currentNote.createdAt));

		// 全て同じ日付なら単純な日付表示（浮上情報なし）
		if (allSameDay) {
			// 今日の場合は何も表示しない
			if (isToday(currentDate)) return '';

			// 今日でない場合は単純に日付表示
			return getDateText(currentDate);
		}

		// グループ内の全てのノートが今日の日付かチェック
		const allToday = item.notes.every(n => isToday(n.createdAt));
		if (allToday) return ''; // 全て今日なら何も表示しない

		// 比較対象のノートを選択
		let compareNote = nextNote;

		// nextNoteが指定されていない場合（主に最初のノート）
		if (!compareNote && noteIndex === 0) {
			// 最初のノートの場合、適切な比較対象を探す
			if (item.notes.length > 1) {
				// まず2番目のノートを取得
				const secondNote = item.notes[1];
				const secondDate = ensureDate(secondNote.createdAt);

				// 2番目のノートが同じ日付かチェック
				if (isSameDay(currentDate, secondDate) && item.notes.length > 2) {
					// 同じ日付で3番目があれば、3番目のノートを使用
					compareNote = item.notes[2];
				} else {
					// 日付が異なるか3番目がなければ2番目のノートを使用
					compareNote = secondNote;
				}
			}
		}

		// 比較対象がない場合は単純な日付表示
		if (!compareNote) return getDateText(currentDate);

		const compareDate = ensureDate(compareNote.createdAt);

		// 同じ日付の場合も単純な日付表示
		if (isSameDay(currentDate, compareDate)) {
			// 今日の場合は何も表示しない
			if (isToday(currentDate)) return '';

			// 今日でない場合は単純に日付表示（浮上情報なし）
			return getDateText(currentDate);
		}

		// 異なる日付の場合は浮上情報を表示
		const userName = (currentNote.user.name || currentNote.user.username).replace(/:([\w-]+):/g, '').trim();
		const dateStr = isToday(currentDate) ? '今日' : formatDateTimeString(currentDate, 'yyyy年M月d日');
		const diffDays = calculateDaysDifference(compareDate, currentDate);

		// 日付差が0の場合は単純な日付表示に切り替え
		if (diffDays === 0) {
			return getDateText(currentDate);
		}

		let messageKey = !item.last && noteIndex === 0 ? 'userFirstPost' : 'userAfterNDays';
		const params = {
			user: userName,
			date: dateStr,
			n: diffDays.toString(),
		};

		// 結果を生成
		const result = formatFloaterMessage(messageKey, params);

		// 最初のノートの場合はキャッシュする
		if (noteIndex === 0) {
			item._cachedInfo = result;
		}

		return result;
	} catch (error) {
		console.error('Error in getCombinedFloaterInfo:', error);
		// エラー時は単純な日付表示にフォールバック
		const fallbackDate = nextNote?.createdAt || item.notes[noteIndex]?.createdAt || new Date();
		return isToday(fallbackDate) ? '' : getDateText(ensureDate(fallbackDate));
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
	// 日付部分のみを比較（時間は無視）
	const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
	const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

	// ミリ秒差分を日数に変換
	const diffTime = Math.abs(d1.getTime() - d2.getTime());
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	return diffDays;
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

// 浮上情報を表示すべきか判断する関数
function isFloaterInfo(note: any, index: number, item: FloaterItem): boolean {
	// 最初のノート、または日付が変わったノートで、次のノートがある場合
	return index === 0 || (
		index < item.notes.length - 1 &&
		!isSameDay(note.createdAt, item.notes[index + 1].createdAt)
	);
}

// 日付情報またはユーザー浮上情報を取得する関数
function getDateInfo(note: any, index: number, item: FloaterItem): string {
	// 最初のノートには常に浮上情報を表示
	if (index === 0) {
		return getCombinedFloaterInfo(item, 0);
	}

	// 中間のノートで日付差があれば浮上情報風の表示
	if (index < item.notes.length - 1 && !isSameDay(note.createdAt, item.notes[index + 1].createdAt)) {
		return getCombinedFloaterInfo(item, index, item.notes[index + 1]);
	}

	// それ以外は単純な日付表示
	return getDateText(ensureDate(note.createdAt));
}

// コンポーネントの関数を外部に公開
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
