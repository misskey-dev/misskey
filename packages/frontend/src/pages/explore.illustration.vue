<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1200px;">
	<div class="_gaps_s">
		<div class="_gaps_m" style="text-align: center;">
			<h2 style="margin: 0;">
				<i class="ti ti-paint" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.illustrations }}
			</h2>
			<div v-if="popularHashtags.length > 0" class="hashtag-list" style="margin-top: 12px; justify-content: center;">
				<MkA
					v-for="tag in popularHashtags.slice(0, 5)"
					:key="tag.tag"
					:to="`/illustration/tags/${tag.tag}`"
					class="hashtag-item"
				>
					#{{ tag.tag }}
				</MkA>
			</div>
		</div>

		<!-- おすすめイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-featured">
			<template #header>
				<i class="ti ti-star ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.featuredIllustrations }}
			</template>
			<MkIllustrationGallery :paginator="featuredIllustrationsPaginator" @beforeNavigate="saveScrollPosition"/>
		</MkFoldableSection>

		<!-- 新着のイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-recent">
			<template #header>
				<i class="ti ti-clock ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.recentIllustrations }}
			</template>
			<MkIllustrationGallery :paginator="recentIllustrationsPaginator" @beforeNavigate="saveScrollPosition"/>
		</MkFoldableSection>

		<!-- ランキングセクション -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-ranking">
			<template #header>
				<i class="ti ti-trophy ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.illustrationRanking }}
			</template>
			<MkIllustrationGallery :paginator="rankingIllustrationsPaginator" @beforeNavigate="saveScrollPosition"/>
		</MkFoldableSection>

		<!-- ハッシュタグで絞り込み -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-hashtags">
			<template #header>
				<i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.popularIllustrationHashtags }}
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
						<span class="count">({{ tag.count }})</span>
					</MkA>
				</div>
			</div>
		</MkFoldableSection>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import MkIllustrationGallery from '@/components/MkIllustrationGallery.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';
import { misskeyApi } from '@/utility/misskey-api.js';

// スクロール位置記憶用のキー
const SCROLL_POSITION_KEY = 'illustration-explore-scroll-position';

// スクロール位置復元済みフラグ
const scrollRestored = ref(false);

// 人気イラストハッシュタグ（タグ名とカウント）
const popularHashtags = ref<Array<{ tag: string; count: number }>>([]);

// おすすめイラスト用Paginator
const featuredIllustrationsPaginator = markRaw(new Paginator('notes/highlight-illustrations' as any, {
	limit: 18,
}));

// 新着イラスト用Paginator
const recentIllustrationsPaginator = markRaw(new Paginator('notes/illustration' as any, {
	limit: 18,
}));

// ランキング用Paginator（リアクション数順、直近3ヶ月）
const rankingIllustrationsPaginator = markRaw(new Paginator('notes/illustration-ranking' as any, {
	limit: 18,
	offsetMode: true,
}));

// スクロール位置を保存
const saveScrollPosition = () => {
	const scrollY = window.scrollY || window.pageYOffset;
	sessionStorage.setItem(SCROLL_POSITION_KEY, String(scrollY));
	console.log('[Scroll Save] Saved position:', scrollY);
};

// スクロール位置を復元
const restoreScrollPosition = () => {
	if (scrollRestored.value) return; // 既に復元済みなら何もしない

	const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
	console.log('[Scroll Restore] Attempting restore, saved position:', savedPosition);

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
					console.log('[Scroll Restore] Restored to position:', targetPosition, 'Current position:', window.scrollY);
				});
			});
		});
	}
};

// Paginatorの読み込み完了を監視してスクロール位置を復元
watch(
	() => [
		featuredIllustrationsPaginator.fetching.value,
		recentIllustrationsPaginator.fetching.value,
		rankingIllustrationsPaginator.fetching.value,
	],
	([featured, recent, ranking]) => {
		// すべてのPaginatorの初回読み込みが完了したら復元
		if (!featured && !recent && !ranking && !scrollRestored.value) {
			restoreScrollPosition();
		}
	},
	{ immediate: true },
);

// pageshow イベントハンドラ（bfcache対応）
const handlePageShow = (event: PageTransitionEvent) => {
	console.log('[PageShow] Event fired, persisted:', event.persisted);
	// bfcacheから復元された場合
	if (event.persisted) {
		scrollRestored.value = false; // フラグをリセット
		restoreScrollPosition();
	}
};

// 初期データ読み込み
onMounted(async () => {
	console.log('[Mounted] Component mounted');

	try {
		// イラスト専用のハッシュタグAPIを使用
		const tags = await misskeyApi('hashtags/illustration' as any, {
			limit: 20,
		}) as Array<{ tag: string; count: number }>;
		popularHashtags.value = tags;
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
	console.log('[Debug] isPopstate:', isPopstate);
	console.log('[Debug] sessionStorage __misskey_router_popstate:', sessionStorage.getItem('__misskey_router_popstate'));

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
		sessionStorage.removeItem(SCROLL_POSITION_KEY);
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
</style>
