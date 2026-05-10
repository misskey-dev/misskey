<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader :actions="headerActions" :tabs="headerTabs"/>
		</template>

		<div class="_spacer" style="--MI_SPACER-w: 700px;">
			<div class="$style.root">
				<section class="_panel" :class="$style.hero">
					<div :class="$style.badge">#活動告知</div>
					<h1 :class="$style.title">活動告知TL</h1>
					<p :class="$style.description">
						配信、動画投稿、作品公開、イベント告知など、活動のお知らせを見つけやすくするための専用ページです。
					</p>
<div :class="$style.guide">
	<div :class="$style.guideTitle">こんな時に使えます</div>
	<ul :class="$style.guideList">
		<li>配信開始・配信予定のお知らせ</li>
		<li>動画投稿・歌ってみた・作品公開の告知</li>
		<li>デビュー・お披露目など、大きなお知らせ</li>
		<li>イベント、企画、募集などのお知らせ</li>
	</ul>
	<p :class="$style.guideNote">
		投稿フォームのスピーカーボタン、または「活動告知を投稿する」ボタンから簡単に投稿できます。
	</p>
</div>

				<div :class="$style.requestBox">
					<div :class="$style.requestTitle">投稿するときのお願い</div>
					<ul :class="$style.requestList">
						<li>活動に関するお知らせに使ってください。</li>
						<li>同じ内容の短時間連投は、できるだけ控えてください。</li>
						<li>内容に合う場合は、ジャンルタグも一緒に使うと見つけてもらいやすくなります。</li>
						<li>雑談や感想は、通常投稿でも大丈夫です。</li>
					</ul>
				</div>

				<div :class="$style.categoryBox">
					<div :class="$style.categoryTitle">ジャンル別に見る</div>
					<p :class="$style.categoryDescription">
						活動内容に合わせて、ジャンル別の活動告知を見られます。
					</p>
					<div :class="$style.categoryTabs">
						<button
							v-for="genre in activityAnnouncementGenres"
							:key="genre.key"
							type="button"
							:class="[$style.categoryTab, { [$style.categoryTabActive]: selectedTag === genre.tag }]"
							@click="selectActivityAnnouncementGenre(genre.tag)"
						>
							<i :class="genre.icon"></i>
							<span>{{ genre.label }}</span>
						</button>
					</div>	

				</div>

					<div :class="$style.actions">
						<MkButton primary @click="openTag">
							#活動告知 を見る
						</MkButton>
						<MkButton @click="composeAnnouncement">
							活動告知を投稿する
						</MkButton>
					</div>
				</section>

				<section class="_panel" :class="$style.timelinePlaceholder">
					<div :class="$style.timelineHeader">
						<div>
							<h2 :class="$style.timelineTitle">活動告知の投稿</h2>
							<p :class="$style.timelineDescription">
								ここに #活動告知 の投稿を直接表示できるようにしていく予定です。
							</p>
						</div>
					</div>

					<MkNotesTimeline :key="selectedTag" :paginator="paginator"/>
				</section>
			</div>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { Paginator } from '@/utility/paginator.js';
import * as os from '@/os.js';

const headerActions = [];
const headerTabs = [];
const activityAnnouncementGenres = [
	{
		key: 'all',
		label: 'すべて',
		icon: 'ti ti-speakerphone',
		tag: '活動告知',
	},
	{
		key: 'stream',
		label: '配信',
		icon: 'ti ti-device-tv',
		tag: '活動告知_配信',
	},
	{
		key: 'video',
		label: '動画',
		icon: 'ti ti-movie',
		tag: '活動告知_動画',
	},
	{
		key: 'works',
		label: '作品公開',
		icon: 'ti ti-palette',
		tag: '活動告知_作品公開',
	},
	{
		key: 'debut',
		label: 'デビュー',
		icon: 'ti ti-sparkles',
		tag: '活動告知_デビュー',
	},
	{
		key: 'reveal',
		label: 'お披露目',
		icon: 'ti ti-confetti',
		tag: '活動告知_お披露目',
	},
	{
		key: 'event',
		label: 'イベント',
		icon: 'ti ti-calendar-event',
		tag: '活動告知_イベント',
		href: '/activity-announcements?tag=活動告知_イベント',
	},
	{
		key: 'recruit',
		label: '募集',
		icon: 'ti ti-users',
		tag: '活動告知_募集',
		href: '/activity-announcements?tag=活動告知_募集',
	},
];

const selectedTag = ref('活動告知');
const paginator = computed(() => markRaw(new Paginator('notes/search-by-tag', {
	limit: 10,
	params: {
		tag: selectedTag.value,
	},
})));

function selectActivityAnnouncementGenre(tag: string) {
	selectedTag.value = tag;
}

function openTag() {
	location.href = '/tags/活動告知';
}

function composeAnnouncement() {
	os.post({
		initialText: '#活動告知 ',
	});
}

</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.hero {
	padding: 24px;
}

.badge {
	display: inline-flex;
	align-items: center;
	width: fit-content;
	margin-bottom: 12px;
	padding: 4px 10px;
	border-radius: 999px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.9em;
	font-weight: 700;
}

.title {
	margin: 0;
	font-size: 1.6em;
}

.description {
	margin: 12px 0 0;
	line-height: 1.7;
	color: var(--MI_THEME-fg);
	opacity: 0.85;
}

.requestBox {
	margin-top: 14px;
	padding: 14px 16px;
	border-radius: 12px;
	background: rgba(56, 189, 248, 0.08);
	border: solid 1px rgba(56, 189, 248, 0.26);
}

.requestTitle {
	font-weight: 700;
	margin-bottom: 8px;
	color: #0284c7;
}

.requestList {
	margin: 0;
	padding-left: 1.4em;
	line-height: 1.8;
	color: var(--MI_THEME-fg);
}

.categoryBox {
	margin-top: 14px;
	padding: 14px 16px;
	border-radius: 12px;
	background: var(--MI_THEME-panel);
	border: solid 1px var(--MI_THEME-divider);
}

.categoryTitle {
	font-weight: 700;
	margin-bottom: 6px;
}

.categoryDescription {
	margin: 0 0 12px;
	font-size: 0.95em;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
	line-height: 1.7;
}

.categoryTabs {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	cursor: pointer;
	appearance: none;
	font: inherit;
}

.categoryTab {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	border-radius: 999px;
	background: var(--MI_THEME-bg);
	border: solid 1px var(--MI_THEME-divider);
	color: var(--MI_THEME-fg);
	font-size: 0.92em;
	font-weight: 700;
	text-decoration: none;
	transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.categoryTab:hover {
	text-decoration: none;
	transform: translateY(-1px);
	border-color: rgba(56, 189, 248, 0.55);
	background: rgba(56, 189, 248, 0.10);
}

.categoryTabActive {
	background: rgba(56, 189, 248, 0.16);
	border-color: rgba(56, 189, 248, 0.55);
	color: #0284c7;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 20px;
}

.guide {
	margin-top: 18px;
	padding: 14px 16px;
	border-radius: 12px;
	background: var(--MI_THEME-bg);
	border: solid 1px var(--MI_THEME-divider);
}

.guideTitle {
	font-weight: 700;
	margin-bottom: 8px;
}

.guideList {
	margin: 0;
	padding-left: 1.4em;
	line-height: 1.8;
}

.guideNote {
	margin: 10px 0 0;
	font-size: 0.95em;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
	line-height: 1.7;
}

.timelinePlaceholder {
	overflow: hidden;
}

.timelineHeader {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	padding: 20px 24px;
	border-bottom: solid 1px var(--MI_THEME-divider);
}

.timelineTitle {
	margin: 0;
	font-size: 1.1em;
}

.timelineDescription {
	margin: 8px 0 0;
	font-size: 0.95em;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
}
</style>
