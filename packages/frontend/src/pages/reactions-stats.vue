<!--
SPDX-FileCopyrightText: lqvp
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkInfo>
		{{ i18n.ts.reactionsStatsDescription }}
	</MkInfo>
	<MkSpacer v-if="tab === 'me'" :contentMax="1000" :marginMin="20">
		<div class="_gaps_s">
			<MkButton key="copyMyReactionsList" @click="copyToClipboard(myReactionsListMfm)"><i class="ti ti-copy"></i> {{ i18n.ts.copyContent }}</MkButton>
		</div>
		<div class="_gaps_s">
			<p>
				<Mfm key="myreactionslist" :text="myReactionsListMfm"></Mfm>
			</p>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'site'" :contentMax="1000" :marginMin="20">
		<div class="_gaps_s">
			<MkButton key="copySiteReactionsList" @click="copyToClipboard(serverReactionsListMfm)"><i class="ti ti-copy"></i> {{ i18n.ts.copyContent }}</MkButton>
		</div>
		<div class="_gaps_s">
			<p>
				<Mfm key="sitereactionslist" :text="serverReactionsListMfm"></Mfm>
			</p>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { signinRequired } from '@/account';
import MkInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
import { copyToClipboard } from '@/scripts/copy-to-clipboard';

const $i = signinRequired();

const myReactionsListMfm = ref('Loading...');
const serverReactionsListMfm = ref('Loading...');

const tab = ref('me');

watch(tab, async () => {
	if (tab.value === 'site' && serverReactionsListMfm.value !== 'Loading...') { return; }
	if (tab.value !== 'site' && myReactionsListMfm.value !== 'Loading...') { return; }

	const reactionsList = await misskeyApi('reactions-stats', { site: tab.value === 'site' });

	const res = reactionsList.map((x) => `${x.reaction} ${x.count}`).join('\n');

	if (tab.value === 'site') {
		serverReactionsListMfm.value = res;
	} else {
		myReactionsListMfm.value = res;
	}
}, {
	deep: true,
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'me',
	title: $i.username,
	icon: 'ti ti-user',
}, {
	key: 'site',
	title: i18n.ts.instance,
	icon: 'ti ti-planet',
}]);

definePageMetadata(() => ({
	title: i18n.ts.reactionsStats,
	icon: 'ti ti-chart-bar',
}));
</script>

<style lang="scss" module>
.header {
	display: flex;
	align-items: center;
	padding: 8px 16px;
	margin-bottom: 8px;
	border-bottom: solid 2px var(--divider);
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 8px;
}

.reaction {
	width: 32px;
	height: 32px;
}

.createdAt {
	margin-left: auto;
}
</style>
