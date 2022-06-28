<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import {
	Chart,
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	LineController,
	CategoryScale,
	LinearScale,
	TimeScale,
	Legend,
	Title,
	Tooltip,
	SubTitle,
	Filler,
	DoughnutController,
} from 'chart.js';
import number from '@/filters/number';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';

Chart.register(
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	LineController,
	DoughnutController,
	CategoryScale,
	LinearScale,
	TimeScale,
	Legend,
	Title,
	Tooltip,
	SubTitle,
	Filler,
);

const props = defineProps<{
	data: { name: string; value: number; color: string; }[];
}>();

const chartEl = ref<HTMLCanvasElement>(null);

// フォントカラー
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

onMounted(() => {
	chartInstance = new Chart(chartEl.value, {
		type: 'doughnut',
		data: {
			labels: props.data.map(x => x.name),
			datasets: [{
				backgroundColor: props.data.map(x => x.color),
				data: props.data.map(x => x.value),
			}],
		},
		options: {
			layout: {
				padding: {
					left: 8,
					right: 8,
					top: 8,
					bottom: 8,
				},
			},
			interaction: {
				intersect: false,
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});
});
</script>

<style lang="scss" scoped>

</style>
