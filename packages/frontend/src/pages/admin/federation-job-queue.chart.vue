<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.status">
		<div :class="$style.statusItem" class="_panel"><div :class="$style.statusLabel">Process</div>{{ number(activeSincePrevTick) }}</div>
		<div :class="$style.statusItem" class="_panel"><div :class="$style.statusLabel">Active</div>{{ number(active) }}</div>
		<div :class="$style.statusItem" class="_panel"><div :class="$style.statusLabel">Waiting</div>{{ number(waiting) }}</div>
		<div :class="$style.statusItem" class="_panel"><div :class="$style.statusLabel">Delayed</div>{{ number(delayed) }}</div>
	</div>
	<div :class="$style.charts">
		<div :class="$style.chart">
			<div :class="$style.chartTitle">Process</div>
			<XChart ref="chartProcess" type="process"/>
		</div>
		<div :class="$style.chart">
			<div :class="$style.chartTitle">Active</div>
			<XChart ref="chartActive" type="active"/>
		</div>
		<div :class="$style.chart">
			<div :class="$style.chartTitle">Delayed</div>
			<XChart ref="chartDelayed" type="delayed"/>
		</div>
		<div :class="$style.chart">
			<div :class="$style.chartTitle">Waiting</div>
			<XChart ref="chartWaiting" type="waiting"/>
		</div>
	</div>
	<MkFolder :defaultOpen="true" :max-height="250">
		<template #icon><i class="ti ti-alert-triangle"></i></template>
		<template #label>Errored instances</template>
		<template #suffix>({{ number(jobs.reduce((a, b) => a + b[1], 0)) }} jobs)</template>

		<div>
			<div v-if="jobs.length > 0">
				<div v-for="job in jobs" :key="job[0]">
					<MkA :to="`/instance-info/${job[0]}`" behavior="window">{{ job[0] }}</MkA>
					<span style="margin-left: 8px; opacity: 0.7;">({{ number(job[1]) }} jobs)</span>
				</div>
			</div>
			<span v-else style="opacity: 0.5;">{{ i18n.ts.noJobs }}</span>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XChart from './federation-job-queue.chart.chart.vue';
import type { ApQueueDomain } from '@/pages/admin/federation-job-queue.vue';
import number from '@/filters/number.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import { genId } from '@/utility/id.js';

const connection = markRaw(useStream().useChannel('queueStats'));

const activeSincePrevTick = ref(0);
const active = ref(0);
const delayed = ref(0);
const waiting = ref(0);
const jobs = ref<Misskey.Endpoints[`admin/queue/${ApQueueDomain}-delayed`]['res']>([]);
const chartProcess = useTemplateRef('chartProcess');
const chartActive = useTemplateRef('chartActive');
const chartDelayed = useTemplateRef('chartDelayed');
const chartWaiting = useTemplateRef('chartWaiting');

const props = defineProps<{
	domain: ApQueueDomain;
}>();

function onStats(stats: Misskey.entities.QueueStats) {
	activeSincePrevTick.value = stats[props.domain].activeSincePrevTick;
	active.value = stats[props.domain].active;
	delayed.value = stats[props.domain].delayed;
	waiting.value = stats[props.domain].waiting;

	if (chartProcess.value != null) chartProcess.value.pushData(stats[props.domain].activeSincePrevTick);
	if (chartActive.value != null) chartActive.value.pushData(stats[props.domain].active);
	if (chartDelayed.value != null) chartDelayed.value.pushData(stats[props.domain].delayed);
	if (chartWaiting.value != null) chartWaiting.value.pushData(stats[props.domain].waiting);
}

function onStatsLog(statsLog: Misskey.entities.QueueStatsLog) {
	const dataProcess: Misskey.entities.QueueStats[ApQueueDomain]['activeSincePrevTick'][] = [];
	const dataActive: Misskey.entities.QueueStats[ApQueueDomain]['active'][] = [];
	const dataDelayed: Misskey.entities.QueueStats[ApQueueDomain]['delayed'][] = [];
	const dataWaiting: Misskey.entities.QueueStats[ApQueueDomain]['waiting'][] = [];

	for (const stats of [...statsLog].reverse()) {
		dataProcess.push(stats[props.domain].activeSincePrevTick);
		dataActive.push(stats[props.domain].active);
		dataDelayed.push(stats[props.domain].delayed);
		dataWaiting.push(stats[props.domain].waiting);
	}

	if (chartProcess.value != null) chartProcess.value.setData(dataProcess);
	if (chartActive.value != null) chartActive.value.setData(dataActive);
	if (chartDelayed.value != null) chartDelayed.value.setData(dataDelayed);
	if (chartWaiting.value != null) chartWaiting.value.setData(dataWaiting);
}

onMounted(() => {
	misskeyApi(`admin/queue/${props.domain}-delayed`).then(result => {
		jobs.value = result;
	});

	connection.on('stats', onStats);
	connection.on('statsLog', onStatsLog);
	connection.send('requestLog', {
		id: genId(),
		length: 200,
	});
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});
</script>

<style lang="scss" module>
.charts {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.chart {
	min-width: 0;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.chartTitle {
	margin-bottom: 8px;
}

.status {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 10px;
}

.statusItem {
	padding: 12px 16px;
}

.statusLabel {
	font-size: 80%;
	opacity: 0.6;
}
</style>
