<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<FormSection>
				<template #label>{{ i18n.ts._userActivity.title }}</template>
				<div class="_gaps_s">
					<MkInput v-model="userId" placeholder="User ID">
						<template #label>{{ i18n.ts.userId }}</template>
					</MkInput>
					<MkInput v-model="days" type="number">
						<template #label>{{ i18n.ts._userActivity.period }}</template>
					</MkInput>
					<MkButton primary :disabled="!userId.trim()" @click="load">
						<i class="ti ti-search"></i> {{ i18n.ts.fetch }}
					</MkButton>
				</div>
			</FormSection>

			<div v-if="loading"><MkLoading/></div>
			<template v-else-if="data">
				<!-- サマリー -->
				<FormSection>
					<template #label>{{ i18n.ts.summary }}</template>
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
						<div v-for="stat in summaryStats" :key="stat.label" :class="$style.statCard">
							<div :class="$style.statValue">{{ stat.value }}</div>
							<div :class="$style.statLabel">{{ stat.label }}</div>
						</div>
					</div>
				</FormSection>

				<!-- 日別アクティビティ -->
				<FormSection v-if="data.dailyActivity.length > 0">
					<template #label>{{ i18n.ts._userActivity.dailyActivity }}</template>
					<div class="_gaps_s">
						<div v-for="d in data.dailyActivity" :key="d.date" :class="$style.dayRow">
							<span :class="$style.dayLabel">{{ d.date }}</span>
							<div :class="$style.dayBar">
								<div
									:class="$style.dayBarFill"
									:style="{ width: maxNotes > 0 ? (d.notes / maxNotes * 100) + '%' : '0%' }"
								></div>
							</div>
							<span :class="$style.dayCount">{{ d.notes }}</span>
						</div>
					</div>
				</FormSection>

				<!-- 最近のノート -->
				<FormSection v-if="data.recentNotes.length > 0">
					<template #label>{{ i18n.ts._userActivity.recentNotes }}</template>
					<div class="_gaps_s">
						<div v-for="note in data.recentNotes" :key="note.id" :class="$style.noteRow">
							<span :class="$style.noteDate">{{ new Date(note.createdAt).toLocaleString() }}</span>
							<span :class="$style.noteText">{{ note.text ?? '(no text)' }}</span>
						</div>
					</div>
				</FormSection>

				<!-- 最近のサインイン -->
				<FormSection v-if="data.recentSignins.length > 0">
					<template #label>{{ i18n.ts._userActivity.recentSignins }}</template>
					<div class="_gaps_s">
						<div v-for="s in data.recentSignins" :key="s.id" :class="$style.noteRow">
							<span :class="$style.noteDate">{{ new Date(s.createdAt).toLocaleString() }}</span>
							<span :class="$style.noteText">{{ s.ip }}</span>
							<span :style="{ color: s.success ? 'var(--MI_THEME-accent)' : 'var(--MI_THEME-error)' }">
								{{ s.success ? '成功' : '失敗' }}
							</span>
						</div>
					</div>
				</FormSection>
			</template>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkLoading from '@/pages/_loading_.vue';
import FormSection from '@/components/form/section.vue';

type ActivityData = {
	userId: string;
	notesCount: number;
	reactionsGiven: number;
	reactionsReceived: number;
	followersCount: number;
	followingCount: number;
	recentNotes: { id: string; createdAt: string; text: string | null; visibility: string }[];
	recentSignins: { id: string; createdAt: string; ip: string; success: boolean }[];
	dailyActivity: { date: string; notes: number }[];
};

const userId = ref('');
const days = ref(30);
const loading = ref(false);
const data = ref<ActivityData | null>(null);

const summaryStats = computed(() => data.value ? [
	{ label: i18n.ts._userActivity.notesCount, value: data.value.notesCount },
	{ label: i18n.ts._userActivity.reactionsGiven, value: data.value.reactionsGiven },
	{ label: i18n.ts._userActivity.reactionsReceived, value: data.value.reactionsReceived },
	{ label: i18n.ts._userActivity.followersCount, value: data.value.followersCount },
	{ label: i18n.ts._userActivity.followingCount, value: data.value.followingCount },
] : []);

const maxNotes = computed(() =>
	data.value ? Math.max(...data.value.dailyActivity.map(d => d.notes), 1) : 1,
);

async function load() {
	if (!userId.value.trim()) return;
	loading.value = true;
	data.value = null;
	try {
		data.value = await misskeyApi('admin/user-activity', {
			userId: userId.value.trim(),
			days: Number(days.value),
		}) as ActivityData;
	} finally {
		loading.value = false;
	}
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
</script>

<style lang="scss" module>
.statCard {
	background: var(--MI_THEME-panelHighlight);
	border-radius: var(--MI-radius);
	padding: 12px;
	text-align: center;
}

.statValue {
	font-size: 1.6em;
	font-weight: bold;
}

.statLabel {
	font-size: 0.8em;
	color: var(--MI_THEME-fgTransparent);
	margin-top: 4px;
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
	min-width: 2.5em;
	text-align: right;
}

.noteRow {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	font-size: 0.9em;
}

.noteDate {
	min-width: 140px;
	color: var(--MI_THEME-fgTransparent);
	flex-shrink: 0;
}

.noteText {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
