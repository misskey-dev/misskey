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
				<template v-for="(note, i) in item.notes.slice(0, displayCount)" :key="note.id">
					<!-- 日付区切り: 日付が変わる場合や最初のノートに表示 -->
					<div
						v-if="shouldShowDateSeparator(note, i, item)" :class="[$style.dateSeparator,
							i === 0 ? $style.firstDateSeparator : '',
							item.isFirstPublicPost && i === 0 ? $style.firstPublicPostSeparator : '',
							shouldHighlightAppearance(note, i, item) ? $style.rarelyAppearedSeparator : '',
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
	timeRange: number; // タブの時間範囲（ミリ秒）
	displayNoteCount?: number; // 表示するノート数
}>();

// 参照
const paginationComponent = shallowRef(null);
const forceReload = ref(0);

// デフォルト値の設定
const displayCount = computed(() => props.displayNoteCount || 3);

// ページネーション設定
const followingPagination = computed(() => ({
	endpoint: 'notes/floater' as const,
	limit: 10,
	offsetMode: true,
	params: {
		anchorDate: props.anchorDate,
		forceReload: forceReload.value,
		noteLimit: 0, // 0=日付差があるまで動的に取得
		maxNoteLimit: 10, // 最大10件まで取得
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

// 日付変換ヘルパー関数の改善
function ensureDate(date: string | Date | null | undefined): Date {
	// null/undefined チェックを追加
	if (date == null) return new Date();

	if (date instanceof Date) {
		// Invalid Date チェック
		if (isNaN(date.getTime())) {
			console.error('Invalid Date object:', date);
			return new Date();
		}
		return date;
	}

	try {
		const parsedDate = new Date(date);

		// Invalid Date チェック
		if (isNaN(parsedDate.getTime())) {
			console.error('Invalid date format:', date);
			return new Date();
		}

		return parsedDate;
	} catch (e) {
		console.error('Error parsing date:', date, e);
		return new Date();
	}
}

// 日付判定関数
function isSameDay(date1: string | Date | null | undefined, date2: string | Date | null | undefined): boolean {
	try {
		// 両方の日付が有効か確認
		if (date1 == null || date2 == null) return false;

		const d1 = ensureDate(date1);
		const d2 = ensureDate(date2);

		return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate();
	} catch (e) {
		console.error('Error in isSameDay:', e);
		return false;
	}
}

// 日付が今日かどうかを判定する関数
function isToday(dateStr: string | Date): boolean {
	try {
		const date = ensureDate(dateStr);
		const today = new Date();
		return date.getFullYear() === today.getFullYear()
			&& date.getMonth() === today.getMonth()
			&& date.getDate() === today.getDate();
	} catch (e) {
		console.error('Error in isToday:', e, { dateStr });
		return false;
	}
}

// 日付表示用の文字列を生成
function getDisplayDateString(date: string | Date): string {
	try {
		return isToday(date) ? '今日' : formatDateTimeString(ensureDate(date), 'yyyy年M月d日');
	} catch (e) {
		console.error('Error in getDisplayDateString:', e, { date });
		return '日付不明';
	}
}

// 日付区切りを表示すべきか判断する関数
function shouldShowDateSeparator(note: any, index: number, item: FloaterItem): boolean {
	// 初浮上の場合は常に表示
	if (item.isFirstPublicPost && index === 0) return true;

	// グループ内の全てのノートが今日の日付かチェック
	const allToday = item.notes.every(n => isToday(n.createdAt));

	// 全て今日のノートなら日付区切りを表示しない（初浮上を除く）
	if (allToday && !(item.isFirstPublicPost && index === 0)) return false;

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

		// 初浮上の場合の特別なメッセージ
		if (item.isFirstPublicPost && noteIndex === 0) {
			const result = formatFloaterMessage('userFirstPublicPost', {
				user: formatUserName(currentNote.user),
				date: getDisplayDateString(currentNote.createdAt),
			});

			// キャッシュする
			item._cachedInfo = result;
			return result;
		}

		// 日付を取得
		const currentDate = ensureDate(currentNote.createdAt);

		// 全てのノートが今日の日付かどうかチェック
		const allToday = item.notes.every(n => isToday(n.createdAt));
		if (allToday && !(item.isFirstPublicPost && noteIndex === 0)) {
			return ''; // 全て今日なら何も表示しない（初浮上を除く）
		}

		// 日付差がないケースを早期リターン
		if (item.notes.length > 1 && noteIndex === 0) {
			const firstNote = item.notes[0];
			const lastNote = item.notes[item.notes.length - 1];

			if (isSameDay(firstNote.createdAt, lastNote.createdAt)) {
				// 同じ日付で今日でない場合は単純日付表示
				if (!isToday(currentDate)) {
					return getDateText(currentDate);
				}
				return ''; // 同じ日付で今日の場合は何も表示しない
			}
			// 日付差がある場合は後続処理に進む（浮上情報表示）
		}

		// 比較対象のノートを選択（ここから浮上情報の処理）
		let compareNote = nextNote;
		if (!compareNote) {
			compareNote = getCompareNote(currentNote, noteIndex, item);
		}

		// 比較対象がない場合は「珍しく浮上」として表示
		if (!compareNote) {
			const userName = formatUserName(currentNote.user);
			const dateStr = getDisplayDateString(currentDate);

			// 比較対象がないので「珍しく浮上」
			return formatFloaterMessage('userRarelyAppeared', {
				user: userName,
				date: dateStr,
			});
		}

		const compareDate = ensureDate(compareNote.createdAt);

		// 同じ日付の場合も単純な日付表示
		if (isSameDay(currentDate, compareDate)) {
			// 今日の場合は何も表示しない
			if (isToday(currentDate)) return '';

			// 今日でない場合は単純に日付表示（浮上情報なし）
			return getDateText(currentDate);
		}

		// 異なる日付の場合は浮上情報を表示
		const userName = formatUserName(currentNote.user);
		const dateStr = getDisplayDateString(currentDate);
		const diffDays = getNoteDaysDifference(currentNote, compareNote);

		// 日付差が0の場合は単純な日付表示に切り替え
		if (diffDays === 0) {
			return getDateText(currentDate);
		}

		// 日付差がある場合は「X日ぶりに浮上」
		// (スタイルによる強調は isRarelyAppeared 関数が担当)
		const messageKey = 'userAfterNDays';

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
	isFirstPublicPost?: boolean; // 初浮上かどうか
}

// 日付計算を専門にする関数
function calculateDaysDifference(olderDate: Date, newerDate: Date): number {
	// 日付部分のみを比較（時間は無視）
	const d1 = new Date(olderDate.getFullYear(), olderDate.getMonth(), olderDate.getDate());
	const d2 = new Date(newerDate.getFullYear(), newerDate.getMonth(), newerDate.getDate());

	// ミリ秒差分を日数に変換（方向性を保持）
	const diffTime = d2.getTime() - d1.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	return diffDays > 0 ? diffDays : 0; // 負の値は0に変換
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
	// 初浮上の場合は初浮上表示
	if (item.isFirstPublicPost && index === 0) {
		return formatFloaterMessage('userFirstPublicPost', {
			user: formatUserName(note.user),
			date: getDisplayDateString(note.createdAt),
		});
	}

	// 日付差がある場合は「X日ぶりに浮上」表示
	if (shouldShowDaysSinceLastAppearance(note, index, item)) {
		const compareNote = getCompareNote(note, index, item);
		const diffDays = getNoteDaysDifference(note, compareNote);

		if (diffDays > 0) {
			return formatFloaterMessage('userAfterNDays', {
				user: formatUserName(note.user),
				date: getDisplayDateString(note.createdAt),
				n: diffDays.toString(),
			});
		}
	}

	// 他の処理は変更なし
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

// 日付差がある場合に「X日ぶりに浮上」を表示すべきか判断する関数
function shouldShowDaysSinceLastAppearance(note: any, index: number, item: FloaterItem): boolean {
	// 初浮上の場合は除外
	if (item.isFirstPublicPost && index === 0) return false;

	const compareNote = getCompareNote(note, index, item);
	return getNoteDaysDifference(note, compareNote) > 0;
}

// スタイルでハイライト表示すべきか判断する関数（特に長期間の浮上）
function shouldHighlightAppearance(note: any, index: number, item: FloaterItem): boolean {
	// 基本的な条件をチェック
	if (!shouldShowDaysSinceLastAppearance(note, index, item)) return false;

	const compareNote = getCompareNote(note, index, item);
	const diffDays = getNoteDaysDifference(note, compareNote);

	// タブの時間範囲との比較
	const tabRangeDays = props.timeRange / (1000 * 60 * 60 * 24);

	// タブの日数範囲の2倍以上前からの浮上なら強調表示
	return diffDays >= tabRangeDays * 2;
}

// ユーザー名のフォーマット（絵文字除去など）を一元化
function formatUserName(user: any): string {
	return (user.name || user.username).replace(/:([\w-]+):/g, '').trim();
}

// 比較対象のノートを取得する関数
function getCompareNote(note: any, index: number, item: FloaterItem): any {
	if (index === 0) {
		return item.notes.length > 1 ? item.notes[item.notes.length - 1] : null;
	} else {
		return item.notes[index - 1];
	}
}

// 2つのノートの日付差を計算する関数
function getNoteDaysDifference(note: any, compareNote: any): number {
	try {
		if (!note || !compareNote || !note.createdAt || !compareNote.createdAt) {
			return 0;
		}

		const currentDate = ensureDate(note.createdAt);
		const compareDate = ensureDate(compareNote.createdAt);

		// 同じ日ならスキップ
		if (isSameDay(currentDate, compareDate)) return 0;

		// 比較対象の日付が現在の日付より古いことを確認
		if (compareDate >= currentDate) return 0;

		return calculateDaysDifference(compareDate, currentDate);
	} catch (e) {
		console.error('Error in getNoteDaysDifference:', e, { note, compareNote });
		return 0;
	}
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
			$separator-padding: 6px 0;
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
				opacity: 0.75;

				span {
					display: inline-block;
					position: relative;
					padding: 0 16px;
					font-size: 0.8em;
					line-height: 1.0em;
					font-weight: normal;
				}

				// モディファイアとして追加
				&.floaterSeparator {
					border-top-left-radius: $border-radius;
					border-top-right-radius: $border-radius;
					padding: 6px 0;
				}

				&.firstDateSeparator {
					border-top: none;
				}

				// 強調表示の共通スタイル
				&.firstPublicPostSeparator,
				&.rarelyAppearedSeparator {
					background: $separator-bg;
					font-weight: bold;
					opacity: 1;
				}

				// 個別の色指定
				&.firstPublicPostSeparator {
					color: var(--MI_THEME-accent); // 初浮上はアクセント色
				}

				&.rarelyAppearedSeparator {
					color: var(--MI_THEME-warn); // 久々に浮上は警告色
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
