<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<!-- 投票作成フォーム -->
			<FormSection>
				<template #label>{{ i18n.ts._userPoll.createPoll }}</template>
				<div class="_gaps_s">
					<MkInput v-model="newQuestion" :placeholder="i18n.ts._userPoll.question">
						<template #label>{{ i18n.ts._userPoll.question }}</template>
					</MkInput>
					<div class="_gaps_s">
						<div v-for="(choice, index) in newChoices" :key="index" style="display: flex; gap: 8px; align-items: center;">
							<MkInput v-model="newChoices[index]" :placeholder="`${i18n.tsx._userPoll.choiceIndex({ n: index + 1 })}`" style="flex: 1;">
								<template #label>{{ i18n.tsx._userPoll.choiceIndex({ n: index + 1 }) }}</template>
							</MkInput>
							<MkButton v-if="newChoices.length > 2" danger @click="removeChoice(index)">
								<i class="ti ti-trash"></i>
							</MkButton>
						</div>
					</div>
					<MkButton v-if="newChoices.length < 10" @click="addChoice">
						<i class="ti ti-plus"></i> {{ i18n.ts._userPoll.addChoice }}
					</MkButton>
					<MkSwitch v-model="newIsAnonymous">
						{{ i18n.ts._userPoll.isAnonymous }}
						<template #caption>{{ i18n.ts._userPoll.isAnonymousDescription }}</template>
					</MkSwitch>
					<MkInput v-model="newDeadline" type="datetime-local">
						<template #label>{{ i18n.ts._userPoll.deadline }}</template>
					</MkInput>
					<MkButton primary :disabled="!canCreate" @click="createPoll">
						<i class="ti ti-send"></i> {{ i18n.ts._userPoll.createPoll }}
					</MkButton>
				</div>
			</FormSection>

			<!-- 投票一覧 -->
			<FormSection>
				<template #label>{{ i18n.ts._userPoll.managePolls }}</template>
				<div class="_gaps_s">
					<div v-if="polls == null">
						<MkLoading/>
					</div>
					<div v-else-if="polls.length === 0">
						<MkInfo>{{ i18n.ts._userPoll.noPollsYet }}</MkInfo>
					</div>
					<div v-for="poll in polls" v-else :key="poll.id" v-panel style="padding: 16px; border-radius: var(--MI-radius);">
						<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
							<div class="_gaps_s" style="flex: 1;">
								<div style="font-weight: bold;">{{ poll.question }}</div>
								<div style="font-size: 0.85em; color: var(--MI_THEME-fgTransparent);">
									{{ poll.choices.join(' / ') }}
								</div>
								<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 0.85em;">
									<span :style="{ color: poll.isActive ? 'var(--MI_THEME-accent)' : 'var(--MI_THEME-fgTransparent)' }">
										{{ poll.isActive ? i18n.ts._userPoll.active : i18n.ts._userPoll.closed }}
									</span>
									<span>{{ i18n.ts._userPoll.voteCount }}: {{ poll.voteCount }}</span>
									<span v-if="poll.isAnonymous" style="color: var(--MI_THEME-fgTransparent);">{{ i18n.ts._userPoll.anonymous }}</span>
									<span v-if="poll.deadline" style="color: var(--MI_THEME-fgTransparent);">
										{{ i18n.tsx._userPoll.deadline_({ date: new Date(poll.deadline).toLocaleString() }) }}
									</span>
								</div>
							</div>
							<div style="display: flex; gap: 8px; flex-shrink: 0;">
								<MkButton @click="viewResults(poll)">
									<i class="ti ti-chart-bar"></i> {{ i18n.ts._userPoll.viewResults }}
								</MkButton>
								<MkButton danger @click="deletePoll(poll)">
									<i class="ti ti-trash"></i>
								</MkButton>
							</div>
						</div>
					</div>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
</MkStickyContainer>

<!-- 結果ダイアログ -->
<Teleport v-if="resultsDialog" to="body">
	<MkModal @click="resultsDialog = null" @closed="resultsDialog = null">
		<div v-if="resultsDialog" v-panel style="padding: 24px; border-radius: var(--MI-radius); min-width: 320px; max-width: 480px;">
			<div class="_gaps">
				<div style="font-weight: bold; font-size: 1.1em;">{{ resultsDialog.question }}</div>
				<div style="font-size: 0.85em; color: var(--MI_THEME-fgTransparent);">
					{{ i18n.tsx._userPoll.totalVotes({ n: resultsDialog.totalVotes }) }}
				</div>
				<div v-for="choice in resultsDialog.choices" :key="choice.index" class="_gaps_s">
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<span>{{ choice.text }}</span>
						<span style="font-weight: bold;">
							{{ choice.votes }} ({{ resultsDialog.totalVotes > 0 ? Math.round(choice.votes / resultsDialog.totalVotes * 100) : 0 }}%)
						</span>
					</div>
					<div :class="$style.bar">
						<div
							:class="$style.barFill"
							:style="{ width: resultsDialog.totalVotes > 0 ? (choice.votes / resultsDialog.totalVotes * 100) + '%' : '0%' }"
						></div>
					</div>
				</div>
				<MkButton style="width: 100%;" @click="resultsDialog = null">
					{{ i18n.ts.close }}
				</MkButton>
			</div>
		</div>
	</MkModal>
</Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';
import MkModal from '@/components/MkModal.vue';
import FormSection from '@/components/form/section.vue';

type Poll = {
	id: string;
	question: string;
	choices: string[];
	isAnonymous: boolean;
	deadline: string | null;
	isActive: boolean;
	voteCount: number;
};

type PollResults = {
	id: string;
	question: string;
	isAnonymous: boolean;
	totalVotes: number;
	choices: { index: number; text: string; votes: number }[];
};

const polls = ref<Poll[] | null>(null);
const resultsDialog = ref<PollResults | null>(null);

const newQuestion = ref('');
const newChoices = ref(['', '']);
const newIsAnonymous = ref(false);
const newDeadline = ref('');

const canCreate = computed(() =>
	newQuestion.value.trim().length > 0 &&
	newChoices.value.filter(c => c.trim().length > 0).length >= 2,
);

async function load() {
	polls.value = await misskeyApi('admin/user-polls/list', {});
}

function addChoice() {
	newChoices.value.push('');
}

function removeChoice(index: number) {
	newChoices.value.splice(index, 1);
}

async function createPoll() {
	const choices = newChoices.value.filter(c => c.trim().length > 0);
	await os.apiWithDialog('admin/user-polls/create', {
		question: newQuestion.value.trim(),
		choices,
		isAnonymous: newIsAnonymous.value,
		deadline: newDeadline.value ? new Date(newDeadline.value).toISOString() : null,
	});

	newQuestion.value = '';
	newChoices.value = ['', ''];
	newIsAnonymous.value = false;
	newDeadline.value = '';

	await load();
}

async function deletePoll(poll: Poll) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._userPoll.confirmDelete,
	});
	if (canceled) return;

	await os.apiWithDialog('admin/user-polls/delete', { pollId: poll.id });
	await load();
}

async function viewResults(poll: Poll) {
	const results = await misskeyApi('admin/user-polls/results', { pollId: poll.id });
	resultsDialog.value = results as PollResults;
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
</script>

<style lang="scss" module>
.bar {
	height: 8px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	overflow: hidden;
}

.barFill {
	height: 100%;
	border-radius: 999px;
	background: var(--MI_THEME-accent);
	transition: width 0.3s ease;
}
</style>
