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
			<MkIllustrationGallery :paginator="tagIllustrationsRankingPaginator"/>
		</MkFoldableSection>

		<!-- 新着のイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="illustration-tag-recent">
			<template #header>
				<i class="ti ti-clock ti-fw" style="margin-right: 0.5em;"></i>
				新着のイラスト
			</template>
			<MkIllustrationGallery :paginator="tagIllustrationsPaginator"/>
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
						<span class="count">({{ tag.count }})</span>
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
import { markRaw, ref, computed, onMounted } from 'vue';
import MkIllustrationGallery from '@/components/MkIllustrationGallery.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';

const props = defineProps<{
	tag: string;
}>();

// 人気イラストハッシュタグ
const popularHashtags = ref<Misskey.entities.Hashtag[]>([]);

// タグ固有のイラスト用Paginator（人気順）
const tagIllustrationsRankingPaginator = markRaw(new Paginator('notes/illustrations-by-tag-ranking', {
	limit: 18,
	offsetMode: true,
	params: {
		tag: props.tag, // 指定されたタグ
	},
}));

// タグ固有のイラスト用Paginator（新着順）
const tagIllustrationsPaginator = markRaw(new Paginator('notes/illustrations-by-tag', {
	limit: 18,
	params: {
		tag: props.tag, // 指定されたタグ
	},
}));

// 初期データ読み込み
onMounted(async () => {
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
