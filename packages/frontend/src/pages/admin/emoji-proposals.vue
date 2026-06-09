<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<MkButton v-for="s in statuses" :key="s.value" :primary="filterStatus === s.value" @click="filterStatus = s.value; load()">
					{{ s.label }}
				</MkButton>
			</div>

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
					<div v-if="p.status === 'pending'" style="display: flex; gap: 8px;">
						<MkButton primary small @click="approve(p)">
							<i class="ti ti-check"></i> {{ i18n.ts._emojiProposal.approve }}
						</MkButton>
						<MkButton danger small @click="reject(p)">
							<i class="ti ti-x"></i> {{ i18n.ts._emojiProposal.reject }}
						</MkButton>
					</div>
				</div>
			</div>
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
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';

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

const statuses = computed(() => [
	{ value: 'pending' as const, label: i18n.ts._emojiProposal.pending },
	{ value: 'approved' as const, label: i18n.ts._emojiProposal.approved },
	{ value: 'rejected' as const, label: i18n.ts._emojiProposal.rejected },
	{ value: 'all' as const, label: i18n.ts._emojiProposal.filter },
]);

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

async function approve(proposal: Proposal) {
	const { canceled } = await os.confirm({ type: 'question', text: i18n.ts._emojiProposal.confirmApprove });
	if (canceled) return;
	await os.apiWithDialog('admin/emoji-proposals/approve', { proposalId: proposal.id });
	await load();
}

async function reject(proposal: Proposal) {
	const { canceled } = await os.confirm({ type: 'warning', text: i18n.ts._emojiProposal.confirmReject });
	if (canceled) return;
	await os.apiWithDialog('admin/emoji-proposals/reject', { proposalId: proposal.id });
	await load();
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
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
