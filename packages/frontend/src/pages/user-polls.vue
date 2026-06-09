<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px;">
		<div v-if="polls == null" class="_gaps">
			<MkLoading/>
		</div>
		<div v-else-if="polls.length === 0" class="_gaps">
			<MkInfo>{{ i18n.ts._userPoll.noPollsYet }}</MkInfo>
		</div>
		<div v-else class="_gaps">
			<div v-for="poll in polls" :key="poll.id" v-panel class="_gaps_s" style="padding: 20px; border-radius: var(--MI-radius);">
				<div style="display: flex; align-items: center; gap: 8px;">
					<i class="ti ti-chart-bar" style="font-size: 1.2em; color: var(--MI_THEME-accent);"></i>
					<span style="font-weight: bold; font-size: 1.1em;">{{ poll.question }}</span>
					<span :class="$style.badge" :style="{ background: poll.isAnonymous ? 'var(--MI_THEME-accentedBg)' : 'var(--MI_THEME-buttonBg)', color: 'var(--MI_THEME-fg)' }">
						{{ poll.isAnonymous ? i18n.ts._userPoll.anonymous : i18n.ts._userPoll.notAnonymous }}
					</span>
				</div>
				<div v-if="poll.deadline" :class="$style.deadline">
					{{ i18n.tsx._userPoll.deadline_({ date: new Date(poll.deadline).toLocaleString() }) }}
				</div>
				<div v-if="!poll.voted" class="_gaps_s">
					<div v-for="(choice, index) in poll.choices" :key="index">
						<MkButton
							:primary="selectedChoice[poll.id] === index"
							@click="selectChoice(poll.id, index)"
							style="width: 100%; text-align: left;"
						>
							{{ choice }}
						</MkButton>
					</div>
					<MkButton
						:disabled="selectedChoice[poll.id] == null || isPollExpired(poll)"
						primary
						style="margin-top: 8px;"
						@click="submitVote(poll)"
					>
						<i class="ti ti-send"></i> {{ i18n.ts._userPoll.vote }}
					</MkButton>
					<div v-if="isPollExpired(poll)" style="color: var(--MI_THEME-fgTransparent); font-size: 0.9em;">
						{{ i18n.ts._userPoll.pollClosed }}
					</div>
				</div>
				<div v-else class="_gaps_s">
					<div :class="$style.votedBadge">
						<i class="ti ti-check"></i> {{ i18n.ts._userPoll.voted }}
					</div>
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';

type Poll = {
	id: string;
	createdAt: string;
	question: string;
	choices: string[];
	isAnonymous: boolean;
	deadline: string | null;
	voted: boolean;
	myChoiceIndex: number | null;
};

const polls = ref<Poll[] | null>(null);
const selectedChoice = ref<Record<string, number>>({});

async function load() {
	polls.value = await misskeyApi('user-polls', {});
}

function selectChoice(pollId: string, index: number) {
	selectedChoice.value = { ...selectedChoice.value, [pollId]: index };
}

function isPollExpired(poll: Poll): boolean {
	if (!poll.deadline) return false;
	return new Date(poll.deadline) < new Date();
}

async function submitVote(poll: Poll) {
	const choiceIndex = selectedChoice.value[poll.id];
	if (choiceIndex == null) return;

	await os.apiWithDialog('user-polls/vote', {
		pollId: poll.id,
		choiceIndex,
	});

	await load();
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.userPolls,
	icon: 'ti ti-chart-bar',
}));
</script>

<style lang="scss" module>
.badge {
	font-size: 0.75em;
	padding: 2px 8px;
	border-radius: 999px;
}

.deadline {
	font-size: 0.85em;
	color: var(--MI_THEME-fgTransparent);
}

.votedBadge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-accent);
	font-weight: bold;
}
</style>
