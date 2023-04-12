<template>
<div ref="rootEl">
	<MkLoading v-if="fetching"/>
	<div v-else>
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick } from 'vue';
import { Chart } from 'chart.js';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';

initChart();

const rootEl = $shallowRef<HTMLDivElement>(null);
const chartEl = $shallowRef<HTMLCanvasElement>(null);
const now = new Date();
let chartInstance: Chart = null;
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const wide = rootEl.offsetWidth > 600;
	const narrow = rootEl.offsetWidth < 400;

	const maxDays = wide ? 10 : narrow ? 5 : 7;

	let raw = await os.api('retention', { });

	raw = raw.slice(0, maxDays);

	const data = [];
	for (const record of raw) {
		let i = 0;
		for (const date of Object.keys(record.data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())) {
			data.push({
				x: i,
				y: record.createdAt,
				v: record.data[date],
			});
			i++;
		}
	}

	fetching = false;

	await nextTick();

	const color = defaultStore.state.darkMode ? '#b4e900' : '#86b300';

	// 視覚上の分かりやすさのため上から最も大きい3つの値の平均を最大値とする
	const max = raw.map(x => x.users).slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / 3;

	const marginEachCell = 12;

	chartInstance = new Chart(chartEl, {
		type: 'matrix',
		data: {
			datasets: [{
				label: 'Active',
				data: data,
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 3,
				backgroundColor(c) {
					const value = c.dataset.data[c.dataIndex].v;
					const a = value / max;
					return alpha(color, a);
				},
				fill: true,
				width(c) {
					const a = c.chart.chartArea ?? {};
					return (a.right - a.left) / maxDays - marginEachCell;
				},
				height(c) {
					const a = c.chart.chartArea ?? {};
					return (a.bottom - a.top) / maxDays - (marginEachCell / 1.5);
				},
			}],
		},
		options: {
			aspectRatio: wide ? 2 : narrow ? 2 : 2,
			layout: {
				padding: {
					left: 8,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					position: 'top',
					suggestedMax: maxDays,
					grid: {
						display: false,
					},
					ticks: {
						display: true,
						padding: 0,
						maxRotation: 0,
						autoSkipPadding: 0,
						autoSkip: false,
						callback: (value, index, values) => value + 1,
					},
				},
				y: {
					type: 'time',
					min: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - maxDays),
					offset: true,
					reverse: true,
					position: 'left',
					time: {
						unit: 'day',
						round: 'day',
					},
					grid: {
						display: false,
					},
					ticks: {
						maxRotation: 0,
						autoSkip: true,
						padding: 1,
						font: {
							size: 9,
						},
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					callbacks: {
						title(context) {
							const v = context[0].dataset.data[context[0].dataIndex];
							return v.d;
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex];
							return ['Active: ' + v.v];
						},
					},
					//mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});
}

onMounted(async () => {
	renderChart();
});
</script>
