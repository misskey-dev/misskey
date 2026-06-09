<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 16px;">
		<div class="_gaps">
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<MkButton
					v-for="p in periods"
					:key="p.value"
					:primary="period === p.value"
					@click="period = p.value; load()"
				>{{ p.label }}</MkButton>
			</div>

			<div v-if="loading"><MkLoading/></div>
			<div v-else class="_gaps">
				<!-- ノート数 -->
				<section>
					<div class="_title" style="font-weight: bold; margin-bottom: 8px;">
						<i class="ti ti-note"></i> {{ i18n.ts._rankings.notes }}
					</div>
					<div v-if="data.notes.length === 0" style="color: var(--MI_THEME-fgTransparent);">{{ i18n.ts._rankings.noData }}</div>
					<div v-else class="_gaps_s">
						<div v-for="(entry, idx) in data.notes" :key="entry.user.id" :class="$style.rankRow">
							<span :class="$style.rank">{{ i18n.tsx._rankings.rank({ n: idx + 1 }) }}</span>
							<MkAvatar :user="entry.user" :class="$style.avatar" link/>
							<MkUserName :user="entry.user" style="flex: 1;"/>
							<span :class="$style.count">{{ entry.count }}</span>
						</div>
					</div>
				</section>

				<!-- リアクション受信数 -->
				<section>
					<div class="_title" style="font-weight: bold; margin-bottom: 8px;">
						<i class="ti ti-heart"></i> {{ i18n.ts._rankings.reactions }}
					</div>
					<div v-if="data.reactions.length === 0" style="color: var(--MI_THEME-fgTransparent);">{{ i18n.ts._rankings.noData }}</div>
					<div v-else class="_gaps_s">
						<div v-for="(entry, idx) in data.reactions" :key="entry.user.id" :class="$style.rankRow">
							<span :class="$style.rank">{{ i18n.tsx._rankings.rank({ n: idx + 1 }) }}</span>
							<MkAvatar :user="entry.user" :class="$style.avatar" link/>
							<MkUserName :user="entry.user" style="flex: 1;"/>
							<span :class="$style.count">{{ entry.count }}</span>
						</div>
					</div>
				</section>

				<!-- フォロワー増加数 -->
				<section>
					<div class="_title" style="font-weight: bold; margin-bottom: 8px;">
						<i class="ti ti-users"></i> {{ i18n.ts._rankings.followers }}
					</div>
					<div v-if="data.followers.length === 0" style="color: var(--MI_THEME-fgTransparent);">{{ i18n.ts._rankings.noData }}</div>
					<div v-else class="_gaps_s">
						<div v-for="(entry, idx) in data.followers" :key="entry.user.id" :class="$style.rankRow">
							<span :class="$style.rank">{{ i18n.tsx._rankings.rank({ n: idx + 1 }) }}</span>
							<MkAvatar :user="entry.user" :class="$style.avatar" link/>
							<MkUserName :user="entry.user" style="flex: 1;"/>
							<span :class="$style.count">{{ entry.count }}</span>
						</div>
					</div>
				</section>
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
import MkButton from '@/components/MkButton.vue';
import MkAvatar from '@/components/MkAvatar.vue';
import MkUserName from '@/components/MkUserName.vue';
import MkLoading from '@/pages/_loading_.vue';

type RankEntry = { user: any; count: number };

const period = ref<'weekly' | 'monthly' | 'alltime'>('weekly');
const loading = ref(true);
const data = ref<{ notes: RankEntry[]; reactions: RankEntry[]; followers: RankEntry[] }>({
	notes: [],
	reactions: [],
	followers: [],
});

const periods = computed(() => [
	{ value: 'weekly' as const, label: i18n.ts._rankings.weekly },
	{ value: 'monthly' as const, label: i18n.ts._rankings.monthly },
	{ value: 'alltime' as const, label: i18n.ts._rankings.alltime },
]);

async function load() {
	loading.value = true;
	try {
		data.value = await misskeyApi('rankings', { period: period.value }) as any;
	} finally {
		loading.value = false;
	}
}

onMounted(load);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.rankings,
	icon: 'ti ti-trophy',
}));
</script>

<style lang="scss" module>
.rankRow {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
}

.rank {
	font-weight: bold;
	font-size: 1.1em;
	color: var(--MI_THEME-accent);
	min-width: 2.5em;
	text-align: center;
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
}

.count {
	font-weight: bold;
	font-size: 1.1em;
}
</style>
