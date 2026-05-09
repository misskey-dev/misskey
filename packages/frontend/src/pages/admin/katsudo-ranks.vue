<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div class="_panel" :class="$style.description">
				<h2 :class="$style.title">かつ廃ランク管理</h2>
				<p>
					登録日数とノート数から、推奨される「かつ廃ランク」を確認するための管理補助ページです。
				</p>
				<p>
					このページではまだロールの付与・解除は行いません。まずは推奨ランクの確認だけを行います。
				</p>
			</div>

			<MkFoldableSection>
				<template #header>ランク条件</template>
				<div :class="$style.rankList">
					<div v-for="rank in katsudoRankDefinitions" :key="rank.key" class="_panel" :class="$style.rankCard">
						<div :class="$style.rankName">{{ rank.name }}</div>
						<div :class="$style.rankCondition">
							登録 {{ rank.minDays }}日以上 / ノート {{ rank.minNotes }}個以上
						</div>
					</div>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>推奨ランクプレビュー</template>
				<div class="_gaps_s">
					<div class="_panel" :class="$style.previewSummary">
						最新100人を対象に、登録日数とノート数から推奨ランクを表示します。
					</div>

					<div :class="$style.userList">
						<div v-for="user in rankedUsers" :key="user.id" class="_panel" :class="$style.userCard">
							<div>
								<div :class="$style.userName">@{{ user.username }}</div>
								<div :class="$style.userMeta">
									登録 {{ user.daysSinceCreated }}日 / ノート {{ user.notesCount }}個
								</div>
							</div>
							<div :class="$style.rankBadge">
								{{ user.suggestedRank.name }}
							</div>
						</div>
					</div>
				</div>
			</MkFoldableSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { katsudoRankDefinitions } from './katsudo-rank-definitions.js';

const users = await misskeyApi('admin/show-users', {
	limit: 100,
	offset: 0,
	sort: '+createdAt',
	state: 'all',
	origin: 'local',
});

function getDaysSinceCreated(createdAt: string) {
	const created = new Date(createdAt).getTime();
	const now = Date.now();

	return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

function getSuggestedRank(daysSinceCreated: number, notesCount: number) {
	return [...katsudoRankDefinitions].reverse().find(rank => {
		return daysSinceCreated >= rank.minDays && notesCount >= rank.minNotes;
	}) ?? katsudoRankDefinitions[0];
}

const rankedUsers = computed(() => {
	return users.map(user => {
		const daysSinceCreated = getDaysSinceCreated(user.createdAt);
		const notesCount = user.notesCount ?? 0;
		const suggestedRank = getSuggestedRank(daysSinceCreated, notesCount);

		return {
			id: user.id,
			username: user.username,
			daysSinceCreated,
			notesCount,
			suggestedRank,
		};
	});
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'かつ廃ランク管理',
	icon: 'ti ti-trophy',
}));
</script>

<style lang="scss" module>
.description {
	padding: 20px;
}

.title {
	margin: 0 0 12px;
	font-size: 1.3em;
}

.rankList {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.rankCard {
	padding: 14px 16px;
}

.rankName {
	font-weight: 700;
}

.rankCondition {
	margin-top: 4px;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
}

.previewSummary {
	padding: 14px 16px;
}

.userList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.userCard {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 14px;
}

.userName {
	font-weight: 700;
}

.userMeta {
	margin-top: 4px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.rankBadge {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.9em;
	font-weight: 700;
}
</style>
