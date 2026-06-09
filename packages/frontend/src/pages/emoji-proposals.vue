<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 16px;">
		<div class="_gaps">
			<!-- 提案フォーム -->
			<FormSection v-if="$i">
				<template #label>{{ i18n.ts._emojiProposal.propose }}</template>
				<div class="_gaps_s">
					<MkInput v-model="newName" :placeholder="i18n.ts._emojiProposal.emojiName">
						<template #label>{{ i18n.ts._emojiProposal.emojiName }}</template>
					</MkInput>
					<MkInput v-model="newImageUrl" :placeholder="i18n.ts._emojiProposal.imageUrl">
						<template #label>{{ i18n.ts._emojiProposal.imageUrl }}</template>
					</MkInput>
					<MkInput v-model="newCategory" :placeholder="i18n.ts._emojiProposal.category">
						<template #label>{{ i18n.ts._emojiProposal.category }}</template>
					</MkInput>
					<MkInput v-model="newDescription" :placeholder="i18n.ts._emojiProposal.description">
						<template #label>{{ i18n.ts._emojiProposal.description }}</template>
					</MkInput>
					<MkButton primary :disabled="!canPropose" @click="propose">
						<i class="ti ti-send"></i> {{ i18n.ts._emojiProposal.propose }}
					</MkButton>
				</div>
			</FormSection>

			<!-- フィルター -->
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<MkButton v-for="s in statuses" :key="s.value" :primary="filterStatus === s.value" @click="filterStatus = s.value; load()">
					{{ s.label }}
				</MkButton>
			</div>

			<!-- 一覧 -->
			<div v-if="proposals == null"><MkLoading/></div>
			<div v-else-if="proposals.length === 0">
				<MkInfo>{{ i18n.ts._emojiProposal.noProposalsYet }}</MkInfo>
			</div>
			<div v-else class="_gaps_s">
				<div v-for="p in proposals" :key="p.id" v-panel style="padding: 16px; border-radius: var(--MI-radius); display: flex; gap: 16px; align-items: center;">
					<img v-if="p.imageUrl" :src="p.imageUrl" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px;"/>
					<div style="flex: 1;" class="_gaps_s">
						<div style="font-weight: bold;">:{{ p.name }}:</div>
						<div v-if="p.category" style="font-size: 0.85em; color: var(--MI_THEME-fgTransparent);">{{ p.category }}</div>
						<div v-if="p.description" style="font-size: 0.9em;">{{ p.description }}</div>
						<div style="display: flex; align-items: center; gap: 8px;">
							<span :class="[$style.statusBadge, $style[p.status]]">{{ statusLabel(p.status) }}</span>
							<span style="font-size: 0.9em;">{{ i18n.tsx._emojiProposal.voteCount({ n: p.voteCount }) }}</span>
						</div>
					</div>
					<MkButton
						v-if="$i && p.status === 'pending' && !p.voted"
						primary
						@click="vote(p)"
					>
						<i class="ti ti-thumb-up"></i> {{ i18n.ts._emojiProposal.vote }}
					</MkButton>
					<span v-else-if="p.voted" style="color: var(--MI_THEME-accent); font-weight: bold;">
						<i class="ti ti-check"></i> {{ i18n.ts._emojiProposal.voted }}
					</span>
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';
import FormSection from '@/components/form/section.vue';

type Proposal = {
	id: string;
	name: string;
	imageUrl: string;
	category: string | null;
	description: string | null;
	status: string;
	voteCount: number;
	voted: boolean;
};

const proposals = ref<Proposal[] | null>(null);
const filterStatus = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending');
const newName = ref('');
const newImageUrl = ref('');
const newCategory = ref('');
const newDescription = ref('');

const statuses = computed(() => [
	{ value: 'pending' as const, label: i18n.ts._emojiProposal.pending },
	{ value: 'approved' as const, label: i18n.ts._emojiProposal.approved },
	{ value: 'rejected' as const, label: i18n.ts._emojiProposal.rejected },
	{ value: 'all' as const, label: i18n.ts._emojiProposal.filter },
]);

const canPropose = computed(() =>
	newName.value.trim().length > 0 &&
	newImageUrl.value.trim().length > 0 &&
	/^[a-zA-Z0-9_]+$/.test(newName.value.trim()),
);

function statusLabel(status: string): string {
	if (status === 'pending') return i18n.ts._emojiProposal.pending;
	if (status === 'approved') return i18n.ts._emojiProposal.approved;
	if (status === 'rejected') return i18n.ts._emojiProposal.rejected;
	return status;
}

async function load() {
	proposals.value = null;
	proposals.value = await misskeyApi('emoji-proposals', { status: filterStatus.value }) as Proposal[];
}

async function propose() {
	await os.apiWithDialog('emoji-proposals/propose', {
		name: newName.value.trim(),
		imageUrl: newImageUrl.value.trim(),
		category: newCategory.value.trim() || null,
		description: newDescription.value.trim() || null,
	});
	newName.value = '';
	newImageUrl.value = '';
	newCategory.value = '';
	newDescription.value = '';
	await load();
}

async function vote(proposal: Proposal) {
	await os.apiWithDialog('emoji-proposals/vote', { proposalId: proposal.id });
	await load();
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.emojiProposals,
	icon: 'ti ti-mood-smile',
}));
</script>

<style lang="scss" module>
.statusBadge {
	font-size: 0.75em;
	padding: 2px 8px;
	border-radius: 999px;
	font-weight: bold;
}

.pending {
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.approved {
	background: #2aabee22;
	color: #2aabee;
}

.rejected {
	background: var(--MI_THEME-errorBg);
	color: var(--MI_THEME-error);
}
</style>
