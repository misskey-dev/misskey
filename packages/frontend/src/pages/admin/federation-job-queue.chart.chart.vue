<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import { Chart } from 'chart.js';
import { store } from '@/store.js';
import { useChartTooltip } from '@/composables/use-chart-tooltip.js';
import { chartVLine } from '@/utility/chart-vline.js';
import { alpha } from '@/utility/color.js';
import { initChart } from '@/utility/init-chart.js';

initChart();

const props = defineProps<{
	type: string;
}>();

const chartEl = useTemplateRef('chartEl');

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart | null = null;

function setData(values: number[]) {
	if (chartInstance == null || chartInstance.data.labels == null) return;
	for (const value of values) {
		chartInstance.data.labels.push('');
		chartInstance.data.datasets[0].data.push(value);
		if (chartInstance.data.datasets[0].data.length > 200) {
			chartInstance.data.labels.shift();
			chartInstance.data.datasets[0].data.shift();
		}
	}
	chartInstance.update();
}

function pushData(value: number) {
	if (chartInstance == null || chartInstance.data.labels == null) return;
	chartInstance.data.labels.push('');
	chartInstance.data.datasets[0].data.push(value);
	if (chartInstance.data.datasets[0].data.length > 200) {
		chartInstance.data.labels.shift();
		chartInstance.data.datasets[0].data.shift();
	}
	chartInstance.update();
}

const label =
	props.type === 'process' ? 'Process' :
	props.type === 'active' ? 'Active' :
	props.type === 'delayed' ? 'Delayed' :
	props.type === 'waiting' ? 'Waiting' :
	'?' as never;

const color =
	props.type === 'process' ? '#00E396' :
	props.type === 'active' ? '#00BCD4' :
	props.type === 'delayed' ? '#E53935' :
	props.type === 'waiting' ? '#FFB300' :
	'?' as never;

onMounted(() => {
	const vLineColor = store.s.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	if (chartEl.value == null) return;

	chartInstance = new Chart(chartEl.value, {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				label: label,
				pointRadius: 0,
				tension: 0.3,
				borderWidth: 2,
				borderJoinStyle: 'round',
				borderColor: color,
				backgroundColor: alpha(color, 0.2),
				fill: true,
				data: [],
			}],
		},
		options: {
			aspectRatio: 2.5,
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					grid: {
						display: true,
					},
					ticks: {
						display: false,
						maxTicksLimit: 10,
					},
				},
				y: {
					min: 0,
					grid: {
					},
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
		plugins: [chartVLine(vLineColor)],
	});
});

defineExpose({
	setData,
	pushData,
});
</script>
