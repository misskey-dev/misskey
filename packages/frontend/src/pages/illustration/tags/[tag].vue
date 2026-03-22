<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

イラストタグページ仕様:
- 指定されたハッシュタグのイラストを表示
- 2つのセクション:
  1. 人気のイラスト: リアクション数順（直近3ヶ月、APIエンドポイント: notes/illustrations-by-tag-ranking）
  2. 新着のイラスト: 投稿日時順（APIエンドポイント: notes/illustrations-by-tag）
- 関連タグセクションで他の人気タグを表示
- イラスト一覧に戻るリンクを提供
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1200px;">
	<div class="_gaps_s">
		<div class="_gaps_m" style="text-align: center;">
			<h2 style="margin: 0;">
				<i class="ti ti-paint" style="margin-right: 0.5em;"></i>
				#{{ tag }}
			</h2>
			<p style="margin: 0; opacity: 0.7;">
				ハッシュタグ「#{{ tag }}」のイラスト
			</p>
		</div>

		<!-- 人気順のイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="illustration-tag-popular">
			<template #header>
				<i class="ti ti-trophy ti-fw" style="margin-right: 0.5em;"></i>
				人気のイラスト
			</template>
			<MkIllustrationGallery :paginator="tagIllustrationsRankingPaginator" @beforeNavigate="saveScrollPosition"/>
		</MkFoldableSection>

		<!-- 新着のイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="illustration-tag-recent">
			<template #header>
				<i class="ti ti-clock ti-fw" style="margin-right: 0.5em;"></i>
				新着のイラスト
			</template>
			<MkIllustrationGallery :paginator="tagIllustrationsPaginator" @beforeNavigate="saveScrollPosition"/>
		</MkFoldableSection>

		<!-- 他の人気タグ -->
		<MkFoldableSection class="_margin" persistKey="illustration-tag-related">
			<template #header>
				<i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>
				関連タグ
			</template>
			<div class="_gaps_s">
				<div class="hashtag-list">
					<MkA
						v-for="tag in popularHashtags"
						:key="tag.tag"
						:to="`/illustration/tags/${tag.tag}`"
						class="hashtag-item"
					>
						#{{ tag.tag }}
						<span v-if="(tag as any).count" class="count">({{ (tag as any).count }})</span>
					</MkA>
				</div>
			</div>
		</MkFoldableSection>

		<!-- イラスト全体に戻る -->
		<div style="text-align: center; margin-top: 1em;">
			<MkA to="/explore#illustration" class="back-link">
				<i class="ti ti-arrow-left" style="margin-right: 0.5em;"></i>
				イラスト一覧に戻る
			</MkA>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import MkIllustrationGallery from '@/components/MkIllustrationGallery.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';

const props = defineProps<{
	tag: string;
}>();

// スクロール位置記憶用のキー（タグごとに異なる）
const getScrollPositionKey = () => `illustration-tag-${props.tag}-scroll-position`;

// スクロール位置復元済みフラグ
const scrollRestored = ref(false);

// 人気イラストハッシュタグ
const popularHashtags = ref<Misskey.entities.Hashtag[]>([]);

// タグ固有のイラスト用Paginator（人気順）
const tagIllustrationsRankingPaginator = markRaw(new Paginator('notes/illustrations-by-tag-ranking' as any, {
	limit: 18,
	offsetMode: true,
	params: {
		tag: props.tag, // 指定されたタグ
	},
}));

// タグ固有のイラスト用Paginator（新着順）
const tagIllustrationsPaginator = markRaw(new Paginator('notes/illustrations-by-tag' as any, {
	limit: 18,
	params: {
		tag: props.tag, // 指定されたタグ
	},
}));

// スクロール位置を保存
const saveScrollPosition = () => {
	const scrollY = window.scrollY || window.pageYOffset;
	sessionStorage.setItem(getScrollPositionKey(), String(scrollY));
	console.log('[Scroll Save] Saved position:', scrollY, 'for tag:', props.tag);
};

// スクロール位置を復元
const restoreScrollPosition = () => {
	if (scrollRestored.value) return; // 既に復元済みなら何もしない

	const savedPosition = sessionStorage.getItem(getScrollPositionKey());
	console.log('[Scroll Restore] Attempting restore for tag:', props.tag, 'saved position:', savedPosition);

	if (savedPosition) {
		const targetPosition = parseInt(savedPosition, 10);

		// requestAnimationFrameで次のフレームで実行
		requestAnimationFrame(() => {
			// さらにもう一度nextTickとrequestAnimationFrameで確実に
			nextTick(() => {
				requestAnimationFrame(() => {
					window.scrollTo({
						top: targetPosition,
						behavior: 'instant' as ScrollBehavior,
					});
					scrollRestored.value = true;
					console.log('[Scroll Restore] Restored to position:', targetPosition, 'for tag:', props.tag, 'Current position:', window.scrollY);
				});
			});
		});
	}
};

// Paginatorの読み込み完了を監視してスクロール位置を復元
watch(
	() => [
		tagIllustrationsRankingPaginator.fetching.value,
		tagIllustrationsPaginator.fetching.value,
	],
	([ranking, recent]) => {
		// すべてのPaginatorの初回読み込みが完了したら復元
		if (!ranking && !recent && !scrollRestored.value) {
			restoreScrollPosition();
		}
	},
	{ immediate: true },
);

// pageshow イベントハンドラ（bfcache対応）
const handlePageShow = (event: PageTransitionEvent) => {
	console.log('[PageShow] Event fired for tag:', props.tag, 'persisted:', event.persisted);
	// bfcacheから復元された場合
	if (event.persisted) {
		scrollRestored.value = false; // フラグをリセット
		restoreScrollPosition();
	}
};

// 初期データ読み込み
onMounted(async () => {
	console.log('[Mounted] Component mounted for tag:', props.tag);

	try {
		// 画像付き投稿が多いハッシュタグAPIを使用
		const tags = await misskeyApi('hashtags/illustration' as any, {
			limit: 20,
		}) as Array<{ tag: string; count: number }>;
		// 現在のタグを除外して表示
		popularHashtags.value = tags
			.filter(tag => tag.tag !== props.tag)
			.slice(0, 10) as any;
	} catch (error) {
		console.error('Failed to load hashtags:', error);
	}

	// pageshow イベント（bfcache対応）
	window.addEventListener('pageshow', handlePageShow);
	// pagehideイベントでも保存（ブラウザの戻る操作に対応）
	window.addEventListener('pagehide', saveScrollPosition);
	// visibilitychangeイベントでも保存（タブ切り替えやバックグラウンドに移行時）
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			saveScrollPosition();
		}
	});

	// ブラウザバック（popstate）で戻ってきた場合にスクロール位置を復元
	const isPopstate = sessionStorage.getItem('__misskey_router_popstate') === 'true';
	console.log('[Debug] Tag page - isPopstate:', isPopstate);
	console.log('[Debug] Tag page - sessionStorage __misskey_router_popstate:', sessionStorage.getItem('__misskey_router_popstate'));

	if (isPopstate) {
		// フラグを消費（次回のマウント時に影響しないように）
		sessionStorage.removeItem('__misskey_router_popstate');

		// 複数のタイミングで復元を試みる
		nextTick(() => {
			restoreScrollPosition();
			// 念のため、少し遅延させても試みる
			setTimeout(() => {
				if (!scrollRestored.value) {
					restoreScrollPosition();
				}
			}, 100);
			setTimeout(() => {
				if (!scrollRestored.value) {
					restoreScrollPosition();
				}
			}, 300);
		});
	} else {
		// 通常のページ遷移の場合は、スクロール位置をクリア
		sessionStorage.removeItem(getScrollPositionKey());
	}
});

// ページから離れる前にスクロール位置を保存
onBeforeUnmount(() => {
	saveScrollPosition();
	// イベントリスナーをクリーンアップ
	window.removeEventListener('pageshow', handlePageShow);
	window.removeEventListener('pagehide', saveScrollPosition);
});
</script>

<style scoped>
.hashtag-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.hashtag-item {
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 16px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-buttonFg);
	text-decoration: none;
	font-size: 0.9em;
	transition: all 0.2s ease;
}

.hashtag-item:hover {
	background: var(--MI_THEME-buttonHoverBg);
	transform: translateY(-1px);
}

.hashtag-item .count {
	margin-left: 4px;
	opacity: 0.7;
	font-size: 0.85em;
}

.back-link {
	display: inline-flex;
	align-items: center;
	padding: 8px 16px;
	border-radius: 20px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-buttonFg);
	text-decoration: none;
	font-size: 0.9em;
	transition: all 0.2s ease;
}

.back-link:hover {
	background: var(--MI_THEME-buttonHoverBg);
	transform: translateY(-1px);
}
</style>
