<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<MkSpacer>
		<div v-if="tab === '-'" class="_gaps">
			<div :class="$style.queues">
				<div v-for="q in queueInfos" :key="q.name" :class="$style.queue" @click="tab = q.name">
					<div><i class="ti ti-http-que"></i> {{ q.name }}</div>
					<div :class="$style.queueCounts">
						<MkKeyValue>
							<template #key>Active</template>
							<template #value>{{ kmg(q.counts.active, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Delayed</template>
							<template #value>{{ kmg(q.counts.delayed, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Waiting</template>
							<template #value>{{ kmg(q.counts.waiting, 2) }}</template>
						</MkKeyValue>
					</div>
					<XChart :dataSet="{ completed: q.metrics.completed.data, failed: q.metrics.failed.data }"/>
				</div>
			</div>
		</div>
		<div v-else class="_gaps">
			<MkFolder :defaultOpen="true">
				<template #label>Overview: {{ tab }}</template>
				<template #icon><i class="ti ti-http-que"></i></template>
				<template #footer>
					<div class="_buttons">
						<MkButton @click="promoteAllQueues"><i class="ti ti-reload"></i> {{ i18n.ts.retryAllQueuesNow }}</MkButton>
						<MkButton danger @click="clear"><i class="ti ti-trash"></i> {{ i18n.ts.clearQueue }}</MkButton>
					</div>
				</template>

				<div class="_gaps">
					<XChart v-if="queueInfo" :dataSet="{ completed: queueInfo.metrics.completed.data, failed: queueInfo.metrics.failed.data }" :aspectRatio="5"/>
					<div v-if="queueInfo" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
						<MkKeyValue>
							<template #key>Active</template>
							<template #value>{{ kmg(queueInfo.counts.active, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Delayed</template>
							<template #value>{{ kmg(queueInfo.counts.delayed, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Waiting</template>
							<template #value>{{ kmg(queueInfo.counts.waiting, 2) }}</template>
						</MkKeyValue>
					</div>
					<hr>
					<div v-if="queueInfo" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
						<MkKeyValue>
							<template #key>Clients: Connected</template>
							<template #value>{{ queueInfo.db.clients.connected }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Clients: Blocked</template>
							<template #value>{{ queueInfo.db.clients.blocked }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Peak</template>
							<template #value>{{ bytes(queueInfo.db.memory.peak, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Total</template>
							<template #value>{{ bytes(queueInfo.db.memory.total, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Used</template>
							<template #value>{{ bytes(queueInfo.db.memory.used, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Uptime</template>
							<template #value>{{ queueInfo.db.uptime }}</template>
						</MkKeyValue>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true" :withSpacer="false">
				<template #label>Jobs: {{ tab }}</template>
				<template #icon><i class="ti ti-list-check"></i></template>

				<MkStickyContainer>
					<template #header>
						<MkTabs
							v-model:tab="jobState"
							:class="$style.jobsTabs" :tabs="[{
								key: 'completed',
								title: 'Completed',
								icon: 'ti ti-check',
							}, {
								key: 'failed',
								title: 'Failed',
								icon: 'ti ti-circle-x',
							}, {
								key: 'latest',
								title: 'Latest',
								icon: 'ti ti-logs',
							}, {
								key: 'active',
								title: 'Active',
								icon: 'ti ti-player-play',
							}, {
								key: 'delayed',
								title: 'Delayed',
								icon: 'ti ti-clock',
							}, {
								key: 'wait',
								title: 'Waiting',
								icon: 'ti ti-hourglass-high',
							}, {
								key: 'paused',
								title: 'Paused',
								icon: 'ti ti-player-pause',
							}]"
						/>
					</template>

					<MkSpacer>
						<MkInput
							v-model="searchQuery"
							:placeholder="i18n.ts.search"
							type="search"
							style="margin-bottom: 16px;"
						>
							<template #prefix><i class="ti ti-search"></i></template>
						</MkInput>

						<MkTl
							v-slot="{ event: job }" :events="jobs.map((job) => ({
								id: job.id,
								createdAt: job.finishedOn ?? job.processedOn ?? job.timestamp,
								data: job,
							}))"
						>
							<MkFolder>
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
										<MkButton rounded @click=""><i class="ti ti-reload"></i> Promote</MkButton>
										<MkButton danger rounded @click=""><i class="ti ti-player-stop"></i> Pause</MkButton>
										<MkButton danger rounded @click=""><i class="ti ti-trash"></i> Delete</MkButton>
										<MkButton style="margin-left: auto;" rounded @click=""><i class="ti ti-copy"></i> Copy raw data</MkButton>
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

										<MkCode :code="JSON5.stringify(job.data, null, '  ')" lang="js"/>
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
						</MkTl>
					</MkSpacer>
				</MkStickyContainer>
			</MkFolder>
		</div>
	</MkSpacer>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import JSON5 from 'json5';
import XHeader from './_header_.vue';
import XChart from './job-queue.chart.vue';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkTabs from '@/components/MkTabs.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkCode from '@/components/MkCode.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkTl from '@/components/MkTl.vue';
import kmg from '@/filters/kmg.js';
import MkInput from '@/components/MkInput.vue';
import bytes from '@/filters/bytes.js';

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

const tab: Ref<typeof QUEUE_TYPES[number] | '-'> = ref('-');
const jobState = ref('latest');
const jobs = ref([]);
const queueInfos = ref([]);
const queueInfo = ref();
const searchQuery = ref('');

watch([tab, jobState], async () => {
	if (tab.value === '-') {
		queueInfos.value = await misskeyApi('admin/queue/queues');
		return;
	}

	queueInfo.value = await misskeyApi('admin/queue/queue-stats', { queue: tab.value });

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
	[{
		key: '-',
		title: i18n.ts.overview,
		icon: 'ti ti-dashboard',
	}].concat(QUEUE_TYPES.map((t) => ({
		key: t,
		title: t,
	}))),
);

definePage(() => ({
	title: i18n.ts.jobQueue,
	icon: 'ti ti-clock-play',
	needWideArea: true,
}));
</script>

<style lang="scss" module>
.queues {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 14px;
}

.queue {
	padding: 14px 18px;
	background-color: var(--MI_THEME-panel);
	border-radius: 8px;
	cursor: pointer;
}

.queueCounts {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	gap: 8px;
	font-size: 85%;
	margin: 6px 0;
}

.jobsTabs {
	background: color(from var(--MI_THEME-panel) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}
</style>
