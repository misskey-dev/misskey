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

					<MkNotesTimeline :paginator="paginator"/>
				</section>
			</div>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { Paginator } from '@/utility/paginator.js';
import * as os from '@/os.js';

const headerActions = [];
const headerTabs = [];
const paginator = markRaw(new Paginator('notes/search-by-tag', {
	limit: 10,
	params: {
		tag: '活動告知',
	},
}));

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

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 20px;
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
