<template>
<div class="pumxzjhg _gaps">
	<div :class="$style.status">
		<div class="item _panel"><div class="label">Process</div>{{ number(activeSincePrevTick) }}</div>
		<div class="item _panel"><div class="label">Active</div>{{ number(active) }}</div>
		<div class="item _panel"><div class="label">Waiting</div>{{ number(waiting) }}</div>
		<div class="item _panel"><div class="label">Delayed</div>{{ number(delayed) }}</div>
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
	<MkFolder :default-open="true" :max-height="250">
		<template #icon><i class="ti ti-alert-triangle"></i></template>
		<template #label>Errored instances</template>
		<template #suffix>({{ number(jobs.reduce((a, b) => a + b[1], 0)) }} jobs)</template>
		
		<div :class="$style.jobs">
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
import { markRaw, onMounted, onUnmounted, ref } from 'vue';
import XChart from './queue.chart.chart.vue';
import number from '@/filters/number';
import * as os from '@/os';
import { stream } from '@/stream';
import { i18n } from '@/i18n';
import MkFolder from '@/components/MkFolder.vue';

const connection = markRaw(stream.useChannel('queueStats'));

const activeSincePrevTick = ref(0);
const active = ref(0);
const delayed = ref(0);
const waiting = ref(0);
const jobs = ref([]);
let chartProcess = $shallowRef<InstanceType<typeof XChart>>();
let chartActive = $shallowRef<InstanceType<typeof XChart>>();
let chartDelayed = $shallowRef<InstanceType<typeof XChart>>();
let chartWaiting = $shallowRef<InstanceType<typeof XChart>>();

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
	> .charts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;

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
}
</style>

<style lang="scss" module>
.status {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 10px;

	&:global {
		> .item {
			padding: 12px 16px;

			> .label {
				font-size: 80%;
				opacity: 0.6;
			}
		}
	}
}

.jobs {
}
</style>
