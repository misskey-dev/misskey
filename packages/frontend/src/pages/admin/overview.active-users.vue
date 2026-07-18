<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root" class="_panel">
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef, ref } from 'vue';
import { Chart } from 'chart.js';
import gradient from 'chartjs-plugin-gradient';
import { misskeyApi } from '@/utility/misskey-api.js';
import { store } from '@/store.js';
import { useChartTooltip } from '@/composables/use-chart-tooltip.js';
import { chartVLine } from '@/utility/chart-vline.js';
import { initChart } from '@/utility/init-chart.js';

initChart();

const chartEl = useTemplateRef('chartEl');
const now = new Date();
let chartInstance: Chart | null = null;
const chartLimit = 7;
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	if (chartEl.value == null) return;

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr: number[]) => {
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: v,
		}));
	};

	const raw = await misskeyApi('charts/active-users', { limit: chartLimit, span: 'day' });

	const vLineColor = store.s.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	const colorRead = '#3498db';
	const colorWrite = '#2ecc71';

	const max = Math.max(...raw.read);

	chartInstance = new Chart(chartEl.value, {
		type: 'bar',
		data: {
			datasets: [{
				parsing: false,
				label: 'Read',
				data: format(raw.read).slice().reverse(),
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: colorRead,
				barPercentage: 0.7,
				categoryPercentage: 0.5,
				fill: true,
			}, {
				parsing: false,
				label: 'Write',
				data: format(raw.write).slice().reverse(),
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: colorWrite,
				barPercentage: 0.7,
				categoryPercentage: 0.5,
				fill: true,
			}],
		},
		options: {
			aspectRatio: 2.5,
			layout: {
				padding: {
					left: 0,
					right: 8,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					type: 'time',
					offset: true,
					time: {
						unit: 'day',
						displayFormats: {
							day: 'M/d',
							month: 'Y/M',
						},
					},
					grid: {
						display: false,
					},
					ticks: {
						display: true,
						maxRotation: 0,
						autoSkipPadding: 8,
					},
				},
				y: {
					position: 'left',
					suggestedMax: 10,
					grid: {
						display: true,
					},
					ticks: {
						display: true,
						//mirror: true,
					},
				},
			},
			interaction: {
				intersect: false,
				mode: 'index',
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
				...({ // TSを黙らすため
					gradient,
				}),
			},
		},
		plugins: [chartVLine(vLineColor)],
	});

	fetching.value = false;
}

onMounted(async () => {
	renderChart();
});
</script>

<style lang="scss" module>
.root {
	padding: 20px;
}
</style>
