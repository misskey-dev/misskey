<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<br>
		<div class="_buttons">
			<MkButton @click="promoteAllQueues"><i class="ti ti-reload"></i> {{ i18n.ts.retryAllQueuesNow }}</MkButton>
			<MkButton danger @click="clear"><i class="ti ti-trash"></i> {{ i18n.ts.clearQueue }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import XHeader from './_header_.vue';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const QUEUE_TYPES = [
	'system',
	'endedPollNotification',
	'deliver',
	'inbox',
	'db',
	'relationship',
	'objectStorage',
	'userWebhookDeliver',
	'systemWebhookDeliver',
] as const;

const tab: Ref<typeof QUEUE_TYPES[number]> = ref('system');
const jobs = ref<{ [key: string]: number }[]>([]);

watch(tab, async () => {
	jobs.value = await misskeyApi('admin/queue/jobs', {
		queue: tab.value,
		state: 'active',
	});
}, { immediate: true });

function clear() {
	os.confirm({
		type: 'warning',
		title: i18n.ts.areYouSure,
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

const headerTabs = computed(() =>
	QUEUE_TYPES.map((t) => ({
		key: t,
		title: t,
	})),
);

definePage(() => ({
	title: i18n.ts.jobQueue,
	icon: 'ti ti-clock-play',
}));
</script>
