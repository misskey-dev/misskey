<template>
<div class="_debobigegoItem">
	<div class="_debobigegoLabel"><slot name="title"></slot></div>
	<div class="_debobigegoPanel pumxzjhg">
		<div class="_table status">
			<div class="_row">
				<div class="_cell"><div class="_label">Process</div>{{ number(activeSincePrevTick) }}</div>
				<div class="_cell"><div class="_label">Active</div>{{ number(active) }}</div>
				<div class="_cell"><div class="_label">Waiting</div>{{ number(waiting) }}</div>
				<div class="_cell"><div class="_label">Delayed</div>{{ number(delayed) }}</div>
			</div>
		</div>
		<div class="">
			<MkQueueChart :domain="domain" :connection="connection"/>
		</div>
		<div class="jobs">
			<div v-if="jobs.length > 0">
				<div v-for="job in jobs" :key="job[0]">
					<span>{{ job[0] }}</span>
					<span style="margin-left: 8px; opacity: 0.7;">({{ number(job[1]) }} jobs)</span>
				</div>
			</div>
			<span v-else style="opacity: 0.5;">{{ $ts.noJobs }}</span>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import number from '@/filters/number';
import MkQueueChart from '@/components/queue-chart.vue';
import * as os from '@/os';

const activeSincePrevTick = ref(0);
const active = ref(0);
const waiting = ref(0);
const delayed = ref(0);
const jobs = ref([]);

const props = defineProps<{
	domain: string,
	connection: any,
}>();

onMounted(() => {
	os.api(props.domain === 'inbox' ? 'admin/queue/inbox-delayed' : props.domain === 'deliver' ? 'admin/queue/deliver-delayed' : null, {}).then(result => {
		jobs.value = result;
	});

	const onStats = (stats) => {
		activeSincePrevTick.value = stats[props.domain].activeSincePrevTick;
		active.value = stats[props.domain].active;
		waiting.value = stats[props.domain].waiting;
		delayed.value = stats[props.domain].delayed;
	};

	props.connection.on('stats', onStats);

	onUnmounted(() => {
		props.connection.off('stats', onStats);
	});
});
</script>

<style lang="scss" scoped>
.pumxzjhg {
	> .status {
		padding: 16px;
		border-bottom: solid 0.5px var(--divider);
	}

	> .jobs {
		padding: 16px;
		border-top: solid 0.5px var(--divider);
		max-height: 180px;
		overflow: auto;
	}
}
</style>
