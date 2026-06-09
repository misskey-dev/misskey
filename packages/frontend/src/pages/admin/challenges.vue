<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<!-- 作成フォーム -->
			<FormSection>
				<template #label>{{ i18n.ts._challenge.createChallenge }}</template>
				<div class="_gaps_s">
					<MkInput v-model="newTitle" :placeholder="i18n.ts._challenge.challengeTitle">
						<template #label>{{ i18n.ts._challenge.challengeTitle }}</template>
					</MkInput>
					<MkTextarea v-model="newDescription" :placeholder="i18n.ts._challenge.description">
						<template #label>{{ i18n.ts._challenge.description }}</template>
					</MkTextarea>
					<MkInput v-model="newHashtag" :placeholder="i18n.ts._challenge.hashtag">
						<template #label>{{ i18n.ts._challenge.hashtag }}</template>
					</MkInput>
					<MkInput v-model="newDeadline" type="datetime-local">
						<template #label>{{ i18n.ts._challenge.deadline }}</template>
					</MkInput>
					<MkSwitch v-model="newIsDailyPrompt">
						{{ i18n.ts._dailyPrompt.isDailyPrompt }}
					</MkSwitch>
					<MkButton primary :disabled="!canCreate" @click="createChallenge">
						<i class="ti ti-send"></i> {{ i18n.ts._challenge.createChallenge }}
					</MkButton>
				</div>
			</FormSection>

			<!-- チャレンジ一覧 -->
			<FormSection>
				<template #label>{{ i18n.ts._challenge.manageChallenges }}</template>
				<div v-if="challenges == null"><MkLoading/></div>
				<div v-else-if="challenges.length === 0">
					<MkInfo>{{ i18n.ts._challenge.noChallengesYet }}</MkInfo>
				</div>
				<div v-else class="_gaps_s">
					<div v-for="c in challenges" :key="c.id" v-panel style="padding: 16px; border-radius: var(--MI-radius);">
						<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
							<div class="_gaps_s" style="flex: 1;">
								<div style="font-weight: bold;">{{ c.title }}</div>
								<div style="font-size: 0.85em; color: var(--MI_THEME-fgTransparent);">#{{ c.hashtag }}</div>
								<div v-if="c.description" style="font-size: 0.9em;">{{ c.description }}</div>
								<div style="font-size: 0.85em; display: flex; gap: 8px; flex-wrap: wrap;">
									<span :style="{ color: c.isActive ? 'var(--MI_THEME-accent)' : 'var(--MI_THEME-fgTransparent)' }">
										{{ c.isActive ? i18n.ts._challenge.active : i18n.ts._challenge.closed }}
									</span>
									<span v-if="c.deadline" style="color: var(--MI_THEME-fgTransparent);">
										{{ new Date(c.deadline).toLocaleString() }}
									</span>
								</div>
							</div>
							<MkButton danger @click="deleteChallenge(c)">
								<i class="ti ti-trash"></i>
							</MkButton>
						</div>
					</div>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';
import FormSection from '@/components/form/section.vue';

type Challenge = {
	id: string;
	title: string;
	description: string | null;
	hashtag: string;
	deadline: string | null;
	isActive: boolean;
};

const challenges = ref<Challenge[] | null>(null);
const newTitle = ref('');
const newDescription = ref('');
const newHashtag = ref('');
const newDeadline = ref('');
const newIsDailyPrompt = ref(false);

const canCreate = computed(() =>
	newTitle.value.trim().length > 0 &&
	newHashtag.value.trim().length > 0,
);

async function load() {
	challenges.value = await misskeyApi('admin/challenges/list', {}) as Challenge[];
}

async function createChallenge() {
	await os.apiWithDialog('admin/challenges/create', {
		title: newTitle.value.trim(),
		description: newDescription.value.trim() || null,
		hashtag: newHashtag.value.trim().replace(/^#/, ''),
		deadline: newDeadline.value ? new Date(newDeadline.value).toISOString() : null,
		isDailyPrompt: newIsDailyPrompt.value,
	});
	newTitle.value = '';
	newDescription.value = '';
	newHashtag.value = '';
	newDeadline.value = '';
	newIsDailyPrompt.value = false;
	await load();
}

async function deleteChallenge(challenge: Challenge) {
	const { canceled } = await os.confirm({ type: 'warning', text: i18n.ts._challenge.confirmDelete });
	if (canceled) return;
	await os.apiWithDialog('admin/challenges/delete', { challengeId: challenge.id });
	await load();
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
</script>
