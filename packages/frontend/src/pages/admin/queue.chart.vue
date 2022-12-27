<template>
<div class="pumxzjhg">
	<div class="_table status">
		<div class="_row">
			<div class="_cell"><div class="_label">Process</div>{{ number(activeSincePrevTick) }}</div>
			<div class="_cell"><div class="_label">Active</div>{{ number(active) }}</div>
			<div class="_cell"><div class="_label">Waiting</div>{{ number(waiting) }}</div>
			<div class="_cell"><div class="_label">Delayed</div>{{ number(delayed) }}</div>
		</div>
	</div>
	<div class="charts">
		<div class="chart">
			<div class="title">Process</div>
			<XChart ref="chartProcess" type="process"/>
		</div>
		<div class="chart">
			<div class="title">Active</div>
			<XChart ref="chartActive" type="active"/>
		</div>
		<div class="chart">
			<div class="title">Delayed</div>
			<XChart ref="chartDelayed" type="delayed"/>
		</div>
		<div class="chart">
			<div class="title">Waiting</div>
			<XChart ref="chartWaiting" type="waiting"/>
		</div>
	</div>
	<div class="jobs">
		<div v-if="jobs.length > 0">
			<div v-for="job in jobs" :key="job[0]">
				<span>{{ job[0] }}</span>
				<span style="margin-left: 8px; opacity: 0.7;">({{ number(job[1]) }} jobs)</span>
			</div>
		</div>
		<span v-else style="opacity: 0.5;">{{ i18n.ts.noJobs }}</span>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, onUnmounted, ref } from 'vue';
import XChart from './queue.chart.chart.vue';
import number from '@/filters/number';
import * as os from '@/os';
import { stream } from '@/stream';
import { i18n } from '@/i18n';

const connection = markRaw(stream.useChannel('queueStats'));

const activeSincePrevTick = ref(0);
const active = ref(0);
const delayed = ref(0);
const waiting = ref(0);
const jobs = ref([]);
let chartProcess = $ref<InstanceType<typeof XChart>>();
let chartActive = $ref<InstanceType<typeof XChart>>();
let chartDelayed = $ref<InstanceType<typeof XChart>>();
let chartWaiting = $ref<InstanceType<typeof XChart>>();

const props = defineProps<{
	domain: string;
}>();

const onStats = (stats) => {
	activeSincePrevTick.value = stats[props.domain].activeSincePrevTick;
	active.value = stats[props.domain].active;
	delayed.value = stats[props.domain].delayed;
	waiting.value = stats[props.domain].waiting;

	chartProcess.pushData(stats[props.domain].activeSincePrevTick);
	chartActive.pushData(stats[props.domain].active);
	chartDelayed.pushData(stats[props.domain].delayed);
	chartWaiting.pushData(stats[props.domain].waiting);
};

const onStatsLog = (statsLog) => {
	const dataProcess = [];
	const dataActive = [];
	const dataDelayed = [];
	const dataWaiting = [];

	for (const stats of [...statsLog].reverse()) {
		dataProcess.push(stats[props.domain].activeSincePrevTick);
		dataActive.push(stats[props.domain].active);
		dataDelayed.push(stats[props.domain].delayed);
		dataWaiting.push(stats[props.domain].waiting);
	}

	chartProcess.setData(dataProcess);
	chartActive.setData(dataActive);
	chartDelayed.setData(dataDelayed);
	chartWaiting.setData(dataWaiting);
};

onMounted(() => {
	os.api(props.domain === 'inbox' ? 'admin/queue/inbox-delayed' : props.domain === 'deliver' ? 'admin/queue/deliver-delayed' : null, {}).then(result => {
		jobs.value = result;
	});

	connection.on('stats', onStats);
	connection.on('statsLog', onStatsLog);
	connection.send('requestLog', {
		id: Math.random().toString().substr(2, 8),
		length: 200,
	});
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});
</script>

<style lang="scss" scoped>
.pumxzjhg {
	> .status {
		padding: 16px;
	}

	> .charts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;

		> .chart {
			min-width: 0;
			padding: 16px;
			background: var(--panel);
			border-radius: var(--radius);

			> .title {
				margin-bottom: 8px;
			}
		}
	}

	> .jobs {
		margin-top: 16px;
		padding: 16px;
		max-height: 180px;
		overflow: auto;
		background: var(--panel);
		border-radius: var(--radius);
	}

}
</style>
