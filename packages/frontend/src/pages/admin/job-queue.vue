<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer>
		<MkTab v-model="jobState">
			<option value="active">active</option>
			<option value="delayed">delayed</option>
			<option value="wait">wait</option>
		</MkTab>
		<div class="_gaps_s">
			<MkFolder v-for="job in jobs" :key="job.id">
				<template #label>{{ job.name }}</template>
				<template #prefix>
					{{ job.id }}
				</template>
				<template #suffix>
					<MkTime :time="job.timestamp" mode="detail"/>
				</template>
				<template #footer>
					<div class="_buttons">
						<MkButton rounded @click=""><i class="ti ti-reload"></i> promote</MkButton>
						<MkButton danger rounded @click=""><i class="ti ti-trash"></i> delete</MkButton>
					</div>
				</template>
			</MkFolder>
		</div>
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
import MkTab from '@/components/MkTab.vue';
import MkFolder from '@/components/MkFolder.vue';

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
const jobState = ref('active');
const jobs = ref<{ [key: string]: number }[]>([]);

watch([tab, jobState], async () => {
	jobs.value = await misskeyApi('admin/queue/jobs', {
		queue: tab.value,
		state: jobState.value,
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
