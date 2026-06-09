<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 16px;">
		<div class="_gaps">
			<!-- 期間選択 -->
			<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
				<span style="font-size: 0.9em; color: var(--MI_THEME-fgTransparent);">{{ i18n.ts._myAnalytics.period }}:</span>
				<MkButton v-for="d in [7, 30, 90]" :key="d" :primary="days === d" small @click="days = d; load()">
					{{ d }}日
				</MkButton>
			</div>

			<div v-if="loading"><MkLoading/></div>
			<template v-else-if="data">
				<!-- サマリーカード -->
				<div :class="$style.summaryGrid">
					<div :class="$style.statCard">
						<div :class="$style.statValue">{{ data.totalNotes.toLocaleString() }}</div>
						<div :class="$style.statLabel">{{ i18n.ts._myAnalytics.totalNotes }}</div>
					</div>
					<div :class="$style.statCard">
						<div :class="$style.statValue">{{ data.totalReactionsReceived.toLocaleString() }}</div>
						<div :class="$style.statLabel">{{ i18n.ts._myAnalytics.totalReactionsReceived }}</div>
					</div>
					<div :class="$style.statCard">
						<div :class="$style.statValue">{{ data.followersCount.toLocaleString() }}</div>
						<div :class="$style.statLabel">{{ i18n.ts._myAnalytics.followersCount }}</div>
					</div>
				</div>

				<!-- 日別投稿グラフ -->
				<FormSection v-if="data.dailyNotes.length > 0">
					<template #label>{{ i18n.ts._myAnalytics.dailyNotes }}</template>
					<div :class="$style.chart">
						<div
							v-for="d in data.dailyNotes"
							:key="d.date"
							:class="$style.chartBar"
							:title="`${d.date}: ${d.count}件`"
						>
							<div
								:class="$style.chartBarFill"
								:style="{ height: maxDaily > 0 ? (d.count / maxDaily * 100) + '%' : '0%' }"
							></div>
							<div :class="$style.chartBarLabel">{{ d.date.slice(5) }}</div>
						</div>
					</div>
				</FormSection>

				<!-- フォロワー増加（週別）-->
				<FormSection v-if="data.followerHistory.length > 0">
					<template #label>{{ i18n.ts._myAnalytics.followerHistory }}</template>
					<div class="_gaps_s">
						<div v-for="w in data.followerHistory" :key="w.week" :class="$style.dayRow">
							<span :class="$style.dayLabel">{{ w.week }}</span>
							<div :class="$style.dayBar">
								<div
									:class="$style.dayBarFill"
									:style="{ width: maxFollower > 0 ? (w.gained / maxFollower * 100) + '%' : '0%' }"
								></div>
							</div>
							<span :class="$style.dayCount">+{{ w.gained }}</span>
						</div>
					</div>
				</FormSection>

				<!-- 反応が多かったノート -->
				<FormSection v-if="data.topNotes.length > 0">
					<template #label>{{ i18n.ts._myAnalytics.topNotes }}</template>
					<div class="_gaps_s">
						<div v-for="(note, idx) in data.topNotes" :key="note.id" :class="$style.noteRow" @click="openNote(note.id)">
							<span :class="$style.noteRank">{{ idx + 1 }}</span>
							<span :class="$style.noteText">{{ note.text ?? '(メディアのみ)' }}</span>
							<span :class="$style.noteReactions">
								<i class="ti ti-heart" style="color: var(--MI_THEME-error);"></i> {{ note.reactions }}
							</span>
						</div>
					</div>
				</FormSection>

				<div v-if="data.topNotes.length === 0 && data.dailyNotes.length === 0" style="color: var(--MI_THEME-fgTransparent); text-align: center; padding: 16px;">
					{{ i18n.ts._myAnalytics.noData }}
				</div>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/pages/_loading_.vue';
import FormSection from '@/components/form/section.vue';

type AnalyticsData = {
	totalNotes: number;
	totalReactionsReceived: number;
	followersCount: number;
	topNotes: { id: string; createdAt: string; text: string | null; visibility: string; reactions: number }[];
	dailyNotes: { date: string; count: number }[];
	followerHistory: { week: string; gained: number }[];
};

const router = useRouter();
const days = ref(30);
const loading = ref(false);
const data = ref<AnalyticsData | null>(null);

const maxDaily = computed(() =>
	data.value ? Math.max(...data.value.dailyNotes.map(d => d.count), 1) : 1,
);

const maxFollower = computed(() =>
	data.value ? Math.max(...data.value.followerHistory.map(w => w.gained), 1) : 1,
);

async function load() {
	loading.value = true;
	data.value = null;
	try {
		data.value = await misskeyApi('my/analytics', { days: days.value }) as AnalyticsData;
	} finally {
		loading.value = false;
	}
}

function openNote(noteId: string) {
	router.push(`/notes/${noteId}`);
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.myAnalytics,
	icon: 'ti ti-chart-line',
}));
</script>

<style lang="scss" module>
.summaryGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 12px;
}

.statCard {
	background: var(--MI_THEME-panelHighlight);
	border-radius: var(--MI-radius);
	padding: 16px;
	text-align: center;
}

.statValue {
	font-size: 1.8em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.statLabel {
	font-size: 0.8em;
	color: var(--MI_THEME-fgTransparent);
	margin-top: 4px;
}

.chart {
	display: flex;
	align-items: flex-end;
	gap: 2px;
	height: 120px;
	padding-bottom: 20px;
	position: relative;
	overflow-x: auto;
}

.chartBar {
	flex: 1;
	min-width: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	height: 100%;
	position: relative;
}

.chartBarFill {
	width: 100%;
	background: var(--MI_THEME-accent);
	border-radius: 3px 3px 0 0;
	min-height: 2px;
	transition: height 0.3s ease;
}

.chartBarLabel {
	font-size: 0.6em;
	color: var(--MI_THEME-fgTransparent);
	margin-top: 2px;
	writing-mode: vertical-rl;
	position: absolute;
	bottom: 0;
}

.dayRow {
	display: flex;
	align-items: center;
	gap: 8px;
}

.dayLabel {
	font-size: 0.85em;
	min-width: 80px;
	color: var(--MI_THEME-fgTransparent);
}

.dayBar {
	flex: 1;
	height: 10px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	overflow: hidden;
}

.dayBarFill {
	height: 100%;
	border-radius: 999px;
	background: var(--MI_THEME-accent);
	transition: width 0.3s ease;
}

.dayCount {
	font-size: 0.85em;
	min-width: 3em;
	text-align: right;
	color: var(--MI_THEME-accent);
	font-weight: bold;
}

.noteRow {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}
}

.noteRank {
	font-weight: bold;
	font-size: 1.1em;
	color: var(--MI_THEME-accent);
	min-width: 1.5em;
	text-align: center;
}

.noteText {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.9em;
}

.noteReactions {
	font-size: 0.9em;
	font-weight: bold;
	flex-shrink: 0;
}
</style>
