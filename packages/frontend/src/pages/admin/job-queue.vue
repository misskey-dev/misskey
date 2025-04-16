<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer>
		<div class="_gaps">
			<MkFolder :defaultOpen="true">
				<template #label>Overview: {{ tab }}</template>
				<div class="_buttons">
					<MkButton @click="promoteAllQueues"><i class="ti ti-reload"></i> {{ i18n.ts.retryAllQueuesNow }}</MkButton>
					<MkButton danger @click="clear"><i class="ti ti-trash"></i> {{ i18n.ts.clearQueue }}</MkButton>
				</div>
			</MkFolder>

			<MkTab v-model="jobState">
				<option value="completed"><i class="ti ti-check"></i> Completed</option>
				<option value="failed"><i class="ti ti-circle-x"></i> Failed</option>
				<option value="latest"><i class="ti ti-logs"></i> Latest</option>
				<option value="active"><i class="ti ti-player-play"></i> Active</option>
				<option value="delayed"><i class="ti ti-clock"></i> Delayed</option>
				<option value="wait"><i class="ti ti-hourglass-high"></i> Waiting</option>
				<option value="paused"><i class="ti ti-player-pause"></i> Paused</option>
			</MkTab>

			<div class="_gaps_s">
				<MkFolder v-for="job in jobs" :key="job.id">
					<template #label>
						<span v-if="job.opts.repeat != null" style="margin-right: 1em;">&lt;repeat&gt;</span>
						<span v-else style="margin-right: 1em;">#{{ job.id }}</span>
						<span>{{ job.name }}</span>
					</template>
					<template #suffix>
						<MkTime :time="job.finishedOn ?? job.processedOn ?? job.timestamp" mode="relative"/>
						<span v-if="job.isFailed && job.finishedOn != null" style="margin-left: 1em; color: var(--MI_THEME-error)"><i class="ti ti-circle-x"></i></span>
						<span v-else-if="job.isFailed" style="margin-left: 1em; color: var(--MI_THEME-warn)"><i class="ti ti-alert-triangle"></i></span>
						<span v-else-if="job.finishedOn != null" style="margin-left: 1em; color: var(--MI_THEME-success)"><i class="ti ti-check"></i></span>
						<span v-else-if="job.delay != null" style="margin-left: 1em; color: var(--MI_THEME-success)"><i class="ti ti-clock"></i></span>
					</template>
					<template #footer>
						<div class="_buttons">
							<MkButton rounded @click=""><i class="ti ti-reload"></i> promote</MkButton>
							<MkButton danger rounded @click=""><i class="ti ti-trash"></i> delete</MkButton>
						</div>
					</template>

					<div class="_gaps_s">
						<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
							<MkKeyValue>
								<template #key>Created at</template>
								<template #value><MkTime :time="job.timestamp" mode="detail"/></template>
							</MkKeyValue>
							<MkKeyValue v-if="job.processedOn != null">
								<template #key>Processed at</template>
								<template #value><MkTime :time="job.processedOn" mode="detail"/></template>
							</MkKeyValue>
							<MkKeyValue v-if="job.finishedOn != null">
								<template #key>Finished at</template>
								<template #value><MkTime :time="job.finishedOn" mode="detail"/></template>
							</MkKeyValue>
							<MkKeyValue v-if="job.processedOn != null && job.finishedOn != null">
								<template #key>Spent</template>
								<template #value>{{ job.finishedOn - job.processedOn }}ms</template>
							</MkKeyValue>
							<MkKeyValue v-if="job.failedReason != null">
								<template #key>Failed reason</template>
								<template #value><i style="color: var(--MI_THEME-error)" class="ti ti-alert-triangle"></i> {{ job.failedReason }}</template>
							</MkKeyValue>
						</div>

						<MkFolder :withSpacer="false" :defaultOpen="false">
							<template #icon><i class="ti ti-package"></i></template>
							<template #label>Data</template>

							<MkCode :code="JSON5.stringify(job.data, null, '  ')"/>
						</MkFolder>

						<MkFolder v-if="job.returnValue != null" :withSpacer="false" :defaultOpen="false">
							<template #icon><i class="ti ti-check"></i></template>
							<template #label>Result</template>

							<MkCode :code="job.returnValue"/>
						</MkFolder>

						<MkFolder v-if="job.stacktrace.length > 0" :withSpacer="false" :defaultOpen="false">
							<template #icon><i class="ti ti-alert-triangle"></i></template>
							<template #label>Error</template>

							<MkCode v-for="log in job.stacktrace" :code="log"/>
						</MkFolder>
					</div>
				</MkFolder>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import JSON5 from 'json5';
import XHeader from './_header_.vue';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkTab from '@/components/MkTab.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkCode from '@/components/MkCode.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';

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
const jobState = ref('latest');
const jobs = ref([]);

watch([tab, jobState], async () => {
	const state = jobState.value;
	jobs.value = await misskeyApi('admin/queue/jobs', {
		queue: tab.value,
		state: state === 'latest' ? ['completed', 'failed'] : [state],
	}).then(res => {
		if (state === 'latest') {
			res.sort((a, b) => a.processedOn > b.processedOn ? -1 : 1);
		} else if (state === 'delayed') {
			res.sort((a, b) => (a.processedOn ?? a.timestamp) > (b.processedOn ?? b.timestamp) ? -1 : 1);
		}
		return res;
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
