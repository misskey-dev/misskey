<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 16px;">
		<div class="_gaps">
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<MkButton :primary="filterStatus === 'active'" @click="filterStatus = 'active'; load()">{{ i18n.ts._challenge.active }}</MkButton>
				<MkButton :primary="filterStatus === 'closed'" @click="filterStatus = 'closed'; load()">{{ i18n.ts._challenge.closed }}</MkButton>
				<MkButton :primary="filterStatus === 'all'" @click="filterStatus = 'all'; load()">{{ i18n.ts.all }}</MkButton>
			</div>

			<div v-if="challenges == null"><MkLoading/></div>
			<div v-else-if="challenges.length === 0">
				<MkInfo>{{ i18n.ts._challenge.noChallengesYet }}</MkInfo>
			</div>
			<div v-else class="_gaps_s">
				<div v-for="c in challenges" :key="c.id" v-panel style="padding: 20px; border-radius: var(--MI-radius);" class="_gaps_s">
					<div style="display: flex; align-items: center; gap: 8px;">
						<i class="ti ti-flag" style="font-size: 1.2em; color: var(--MI_THEME-accent);"></i>
						<span style="font-weight: bold; font-size: 1.1em;">{{ c.title }}</span>
						<span :class="[$style.badge, c.isActive ? $style.active : $style.closed]">
							{{ c.isActive ? i18n.ts._challenge.active : i18n.ts._challenge.closed }}
						</span>
					</div>
					<div v-if="c.description" style="color: var(--MI_THEME-fg);">{{ c.description }}</div>
					<div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.9em; color: var(--MI_THEME-fgTransparent);">
						<span><i class="ti ti-hash"></i> {{ c.hashtag }}</span>
						<span><i class="ti ti-users"></i> {{ i18n.tsx._challenge.participants({ n: c.participantCount }) }}</span>
						<span v-if="c.deadline"><i class="ti ti-clock"></i> {{ new Date(c.deadline).toLocaleString() }}</span>
					</div>
					<div v-if="c.isActive" :class="$style.joinHint">
						{{ i18n.tsx._challenge.joinChallenge({ hashtag: c.hashtag }) }}
					</div>
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
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';

type Challenge = {
	id: string;
	title: string;
	description: string | null;
	hashtag: string;
	deadline: string | null;
	isActive: boolean;
	participantCount: number;
};

const challenges = ref<Challenge[] | null>(null);
const filterStatus = ref<'active' | 'closed' | 'all'>('active');

async function load() {
	challenges.value = null;
	challenges.value = await misskeyApi('challenges', { status: filterStatus.value }) as Challenge[];
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.challenges,
	icon: 'ti ti-flag',
}));
</script>

<style lang="scss" module>
.badge {
	font-size: 0.75em;
	padding: 2px 8px;
	border-radius: 999px;
	font-weight: bold;
}

.active {
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.closed {
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fgTransparent);
}

.joinHint {
	font-size: 0.9em;
	color: var(--MI_THEME-accent);
	font-style: italic;
}
</style>
