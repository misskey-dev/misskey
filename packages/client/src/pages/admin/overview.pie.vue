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
	data: { name: string; value: number; color: string; onClick?: () => void }[];
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
				borderColor: getComputedStyle(document.documentElement).getPropertyValue('--panel'),
				borderWidth: 2,
				hoverOffset: 0,
				data: props.data.map(x => x.value),
			}],
		},
		options: {
			layout: {
				padding: {
					left: 16,
					right: 16,
					top: 16,
					bottom: 16,
				},
			},
			onClick: (ev) => {
				const hit = chartInstance.getElementsAtEventForMode(ev, 'nearest', { intersect: true }, false)[0];
				if (hit && props.data[hit.index].onClick) {
					props.data[hit.index].onClick();
				}
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
