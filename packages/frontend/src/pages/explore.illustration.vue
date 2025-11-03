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
			<MkIllustrationGallery :paginator="featuredIllustrationsPaginator"/>
		</MkFoldableSection>

		<!-- 新着のイラストセクション -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-recent">
			<template #header>
				<i class="ti ti-clock ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.recentIllustrations }}
			</template>
			<MkIllustrationGallery :paginator="recentIllustrationsPaginator"/>
		</MkFoldableSection>

		<!-- ランキングセクション -->
		<MkFoldableSection class="_margin" persistKey="explore-illustration-ranking">
			<template #header>
				<i class="ti ti-trophy ti-fw" style="margin-right: 0.5em;"></i>
				{{ i18n.ts.illustrationRanking }}
			</template>
			<MkIllustrationGallery :paginator="rankingIllustrationsPaginator"/>
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
import { markRaw, ref, onMounted } from 'vue';
import MkIllustrationGallery from '@/components/MkIllustrationGallery.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';
import { misskeyApi } from '@/utility/misskey-api.js';

// 人気イラストハッシュタグ（タグ名とカウント）
const popularHashtags = ref<Array<{ tag: string; count: number }>>([]);

// おすすめイラスト用Paginator
const featuredIllustrationsPaginator = markRaw(new Paginator('notes/highlight-illustrations', {
	limit: 10,
}));

// 新着イラスト用Paginator
const recentIllustrationsPaginator = markRaw(new Paginator('notes/illustration', {
	limit: 10,
}));

// ランキング用Paginator（リアクション数順、直近3ヶ月）
const rankingIllustrationsPaginator = markRaw(new Paginator('notes/illustration-ranking', {
	limit: 10,
	offsetMode: true,
}));

// 初期データ読み込み
onMounted(async () => {
	try {
		// イラスト専用のハッシュタグAPIを使用
		const tags = await misskeyApi('hashtags/illustration' as any, {
			limit: 20,
		}) as Array<{ tag: string; count: number }>;
		popularHashtags.value = tags;
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
</style>
