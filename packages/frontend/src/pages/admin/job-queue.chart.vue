<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef, watch } from 'vue';
import { Chart } from 'chart.js';
import { store } from '@/store.js';
import { useChartTooltip } from '@/composables/use-chart-tooltip.js';
import { chartVLine } from '@/utility/chart-vline.js';
import { alpha } from '@/utility/color.js';
import { initChart } from '@/utility/init-chart.js';

initChart();

const props = defineProps<{
	dataSet: {
		completed: number[];
		failed: number[];
	};
	aspectRatio?: number;
}>();

const chartEl = useTemplateRef('chartEl');

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

function setData() {
	if (chartInstance == null) return;
	chartInstance.data.labels = [];
	for (let i = 0; i < Math.max(props.dataSet.completed.length, props.dataSet.failed.length); i++) {
		chartInstance.data.labels.push('');
	}
	chartInstance.data.datasets[0].data = props.dataSet.completed;
	chartInstance.data.datasets[1].data = props.dataSet.failed;
	chartInstance.update();
}

watch(() => props.dataSet, () => {
	setData();
});

onMounted(() => {
	if (chartEl.value == null) return;

	const vLineColor = store.s.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	chartInstance = new Chart(chartEl.value, {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				label: 'Completed',
				pointRadius: 0,
				tension: 0.3,
				borderWidth: 2,
				borderJoinStyle: 'round',
				borderColor: '#4caf50',
				backgroundColor: alpha('#4caf50', 0.2),
				fill: true,
				data: [],
			}, {
				label: 'Failed',
				pointRadius: 0,
				tension: 0.3,
				borderWidth: 2,
				borderJoinStyle: 'round',
				borderColor: '#ff0000',
				backgroundColor: alpha('#ff0000', 0.2),
				fill: true,
				data: [],
			}],
		},
		options: {
			aspectRatio: props.aspectRatio ?? 2.5,
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

	setData();
});
</script>
