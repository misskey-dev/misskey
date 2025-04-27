<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<XQueue v-if="tab === 'deliver'" domain="deliver"/>
		<XQueue v-else-if="tab === 'inbox'" domain="inbox"/>
		<br>
		<div class="_buttons">
			<MkButton @click="promoteAllQueues"><i class="ti ti-reload"></i> {{ i18n.ts.retryAllQueuesNow }}</MkButton>
			<MkButton danger @click="clear"><i class="ti ti-trash"></i> {{ i18n.ts.clearQueue }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XQueue from './federation-job-queue.chart.vue';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';

export type ApQueueDomain = 'deliver' | 'inbox';

const tab: Ref<ApQueueDomain> = ref('deliver');

function clear() {
	os.confirm({
		type: 'warning',
		title: i18n.ts.clearQueueConfirmTitle,
		text: i18n.ts.clearQueueConfirmText,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/queue/clear', { queue: tab.value, state: '*' });
	});
}

function promoteAllQueues() {
	os.confirm({
		type: 'warning',
		title: i18n.ts.retryAllQueuesConfirmTitle,
		text: i18n.ts.retryAllQueuesConfirmText,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/queue/promote-jobs', { queue: tab.value });
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'deliver',
	title: 'Deliver',
}, {
	key: 'inbox',
	title: 'Inbox',
}]);

definePage(() => ({
	title: i18n.ts.federationJobs,
	icon: 'ti ti-clock-play',
}));
</script>
