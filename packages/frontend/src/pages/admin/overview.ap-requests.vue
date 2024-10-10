<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root">
		<div class="charts _panel">
			<div class="chart">
				<canvas ref="chartEl2"></canvas>
			</div>
			<div class="chart">
				<canvas ref="chartEl"></canvas>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, shallowRef, ref } from 'vue';
import { Chart } from 'chart.js';
import gradient from 'chartjs-plugin-gradient';
import isChromatic from 'chromatic';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useChartTooltip } from '@/scripts/use-chart-tooltip.js';
import { chartVLine } from '@/scripts/chart-vline.js';
import { defaultStore } from '@/store.js';
import { alpha } from '@/scripts/color.js';
import { initChart } from '@/scripts/init-chart.js';

initChart();

const chartLimit = 50;
const chartEl = shallowRef<HTMLCanvasElement>();
const chartEl2 = shallowRef<HTMLCanvasElement>();
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();
const { handler: externalTooltipHandler2 } = useChartTooltip();

onMounted(async () => {
	const now = isChromatic() ? new Date('2024-08-31T10:00:00Z') : new Date();

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

	const formatMinus = (arr: number[]) => {
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: -v,
		}));
	};

	const raw = await misskeyApi('charts/ap-request', { limit: chartLimit, span: 'day' });

	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
	const succColor = '#87e000';
	const failColor = '#ff4400';

	const succMax = Math.max(...raw.deliverSucceeded);
	const failMax = Math.max(...raw.deliverFailed);

	new Chart(chartEl.value, {
		type: 'line',
		data: {
			datasets: [{
				parsing: false,
				label: 'Out: Succ',
				data: format(raw.deliverSucceeded).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 2,
				borderColor: succColor,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: alpha(succColor, 0.35),
				fill: true,
				clip: 8,
			}, {
				parsing: false,
				label: 'Out: Fail',
				data: formatMinus(raw.deliverFailed).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 2,
				borderColor: failColor,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: alpha(failColor, 0.35),
				fill: true,
				clip: 8,
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
					stacked: true,
					offset: false,
					time: {
						stepSize: 1,
						unit: 'day',
					},
					grid: {
						display: true,
					},
					ticks: {
						display: true,
						maxRotation: 0,
						autoSkipPadding: 16,
					},
					min: getDate(chartLimit).getTime(),
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
						callback: (value, index, values) => value < 0 ? -value : value,
					},
				},
			},
			interaction: {
				intersect: false,
				mode: 'index',
			},
			elements: {
				point: {
					hoverRadius: 5,
					hoverBorderWidth: 2,
				},
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
					callbacks: {
						label: context => `${context.dataset.label}: ${Math.abs(context.parsed.y)}`,
					},
				},
				gradient,
			},
		},
		plugins: [chartVLine(vLineColor)],
	});

	new Chart(chartEl2.value, {
		type: 'bar',
		data: {
			datasets: [{
				parsing: false,
				label: 'In',
				data: format(raw.inboxReceived).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: '#0cc2d6',
				barPercentage: 0.8,
				categoryPercentage: 0.9,
				fill: true,
				clip: 8,
			}],
		},
		options: {
			aspectRatio: 5,
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
					offset: false,
					time: {
						stepSize: 1,
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
						display: false,
						maxRotation: 0,
						autoSkipPadding: 16,
					},
					min: getDate(chartLimit).getTime(),
				},
				y: {
					position: 'left',
					suggestedMax: 10,
					grid: {
						display: true,
					},
				},
			},
			interaction: {
				intersect: false,
				mode: 'index',
			},
			elements: {
				point: {
					hoverRadius: 5,
					hoverBorderWidth: 2,
				},
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
					external: externalTooltipHandler2,
				},
				gradient,
			},
		},
		plugins: [chartVLine(vLineColor)],
	});

	fetching.value = false;
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .charts {
			> .chart {
				padding: 16px;

				&:first-child {
					border-bottom: solid 0.5px var(--MI_THEME-divider);
				}
			}
		}
	}
}
</style>

