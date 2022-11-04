<template>
<div class="wbrkwale">
	<MkLoading v-if="fetching"/>
	<transition-group v-else tag="div" :name="$store.state.animation ? 'chart' : ''" class="instances">
		<MkA v-for="(instance, i) in instances" :key="instance.id" :to="`/instance-info/${instance.host}`" class="instance">
			<img v-if="instance.iconUrl" :src="instance.iconUrl" alt=""/>
			<div class="body">
				<div class="name">{{ instance.name ?? instance.host }}</div>
				<div class="host">{{ instance.host }}</div>
			</div>
			<MkMiniChart class="chart" :src="charts[i].requests.received"/>
		</MkA>
	</transition-group>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import MkMiniChart from '@/components/MkMiniChart.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';

const instances = ref([]);
const charts = ref([]);
const fetching = ref(true);

const fetch = async () => {
	const fetchedInstances = await os.api('federation/instances', {
		sort: '+lastCommunicatedAt',
		limit: 5,
	});
	const fetchedCharts = await Promise.all(fetchedInstances.map(i => os.apiGet('charts/instance', { host: i.host, limit: 16, span: 'hour' })));
	instances.value = fetchedInstances;
	charts.value = fetchedCharts;
	fetching.value = false;
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});
</script>

<style lang="scss" scoped>
.wbrkwale {
	> .instances {
		.chart-move {
			transition: transform 1s ease;
		}

		> .instance {
			display: flex;
			align-items: center;
			padding: 16px 20px;

			&:not(:last-child) {
				border-bottom: solid 0.5px var(--divider);
			}

			> img {
				display: block;
				width: 34px;
				height: 34px;
				object-fit: cover;
				border-radius: 4px;
				margin-right: 12px;
			}

			> .body {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);
				padding-right: 8px;

				> .name {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				> .host {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>
