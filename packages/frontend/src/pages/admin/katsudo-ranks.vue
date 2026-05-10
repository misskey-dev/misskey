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
<div :class="$style.roleStatus">
	<span v-if="getRoleByName(rank.name)">
		✅ ロールあり
	</span>
	<span v-else>
		❌ ロールなし
	</span>
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
<div :class="$style.rankInfo">
	<div>
		現在：{{ user.currentRankName }}
	</div>

	<div>
		推奨：{{ user.suggestedRank.name }}
	</div>

	<div>
		状態：

		<span
			:class="[
				$style.statusBadge,
				$style[user.rankStatus],
			]"
		>
			{{ user.rankStatusLabel }}
		</span>
	</div>
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
	limit: 20,
	offset: 0,
	sort: '+createdAt',
	state: 'all',
	origin: 'local',
});

const roles = await misskeyApi('admin/roles/list');

const userDetails = await Promise.all(users.map(user => misskeyApi('admin/show-user', {
        userId: user.id,
})));

console.log('katsudo rank users:', users);

function getDaysSinceCreated(createdAt: string) {
	const created = new Date(createdAt).getTime();
	const now = Date.now();

	return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

function getRoleByName(name: string) {
	return roles.find(role => role.name === name) ?? null;
}

function getSuggestedRank(daysSinceCreated: number, notesCount: number) {
	return [...katsudoRankDefinitions].reverse().find(rank => {
		return daysSinceCreated >= rank.minDays && notesCount >= rank.minNotes;
	}) ?? katsudoRankDefinitions[0];
}

function getRankStatus(
	currentRankName: string,
	suggestedRankName: string,
) {
	if (currentRankName === '未付与') {
		return 'notAssigned';
	}

	if (currentRankName === suggestedRankName) {
		return 'ok';
	}

	const currentIndex = katsudoRankDefinitions.findIndex(rank => {
		return rank.name === currentRankName;
	});

	const suggestedIndex = katsudoRankDefinitions.findIndex(rank => {
		return rank.name === suggestedRankName;
	});

	if (currentIndex === -1 || suggestedIndex === -1) {
		return 'ok';
	}

	if (currentIndex < suggestedIndex) {
		return 'promotable';
	}

	return 'demotionCandidate';
}

function getRankStatusLabel(status: string) {
	switch (status) {
		case 'ok':
			return 'OK';

		case 'promotable':
			return '昇格可能';

		case 'demotionCandidate':
			return '降格候補';

		case 'notAssigned':
			return '未付与';

		default:
			return 'OK';
	}
}

const rankedUsers = computed(() => {
	return users.map(user => {
		const daysSinceCreated = getDaysSinceCreated(user.createdAt);
		const notesCount = user.notesCount ?? 0;
		const suggestedRank = getSuggestedRank(daysSinceCreated, notesCount);

                const detail = userDetails.find(x => x.id === user.id);
                const currentRank = detail?.roles?.find(role => katsudoRankDefinitions.some(rank => rank.name === role.name)) ?? null;

const currentRankName =
	currentRank?.name ?? '未付与';

const rankStatus = getRankStatus(
	currentRankName,
	suggestedRank.name,
);

return {
	id: user.id,
	username: user.username,
	daysSinceCreated,
	notesCount,
	suggestedRank,

	currentRankName,

	rankStatus,

	rankStatusLabel:
		getRankStatusLabel(rankStatus),
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
.roleStatus {
	margin-top: 6px;
	font-size: 0.85em;
	opacity: 0.8;
}

.rankInfo {
        flex-shrink: 0;
        padding: 6px 10px;
        border-radius: 12px;
        background: var(--MI_THEME-accentedBg);
        color: var(--MI_THEME-accent);
        font-size: 0.9em;
        font-weight: 700;
        line-height: 1.6;
}

.statusBadge {
	display: inline-block;

	margin-left: 4px;
	padding: 2px 8px;

	border-radius: 999px;

	font-size: 0.85em;
	font-weight: 700;
}

.ok {
	background:
		rgba(52, 199, 89, 0.18);

	color: #34c759;
}

.promotable {
	background:
		rgba(46, 204, 113, 0.18);

	color: #2ecc71;
}

.demotionCandidate {
	background:
		rgba(241, 196, 15, 0.18);

	color: #d4a000;
}

.notAssigned {
	background:
		rgba(231, 76, 60, 0.18);

	color: #e74c3c;
}
</style>
