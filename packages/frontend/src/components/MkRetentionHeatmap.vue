<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<MkLoading v-if="fetching"/>
	<div v-else>
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, shallowRef, ref } from 'vue';
import { Chart } from 'chart.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { useChartTooltip } from '@/scripts/use-chart-tooltip.js';
import { alpha } from '@/scripts/color.js';
import { initChart } from '@/scripts/init-chart.js';

initChart();

const rootEl = shallowRef<HTMLDivElement | null>(null);
const chartEl = shallowRef<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

async function renderChart() {
	if (rootEl.value == null) return;
	if (chartInstance) {
		chartInstance.destroy();
	}

	const wide = rootEl.value.offsetWidth > 600;
	const narrow = rootEl.value.offsetWidth < 400;

	const maxDays = wide ? 10 : narrow ? 5 : 7;

	let raw = await misskeyApi('retention', { });

	raw = raw.slice(0, maxDays + 1);

	const data: {
		x: number;
		y: string;
		v: number;
	}[] = [];

	for (const record of raw) {
		data.push({
			x: 0,
			y: record.createdAt,
			v: record.users,
		});

		let i = 1;
		for (const date of Object.keys(record.data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())) {
			data.push({
				x: i,
				y: record.createdAt,
				v: record.data[date],
			});
			i++;
		}
	}

	fetching.value = false;

	await nextTick();

	const color = defaultStore.state.darkMode ? '#b4e900' : '#86b300';

	const getYYYYMMDD = (date: Date) => {
		const y = date.getFullYear().toString().padStart(2, '0');
		const m = (date.getMonth() + 1).toString().padStart(2, '0');
		const d = date.getDate().toString().padStart(2, '0');
		return `${y}/${m}/${d}`;
	};

	const max = (createdAt: string) => raw.find(x => x.createdAt === createdAt)!.users;

	const marginEachCell = 12;

	if (chartEl.value == null) return;

	chartInstance = new Chart(chartEl.value, {
		type: 'matrix',
		data: {
			datasets: [{
				label: 'Active',
				data: data as any,
				borderWidth: 0,
				borderRadius: 3,
				backgroundColor(c) {
					const v = c.dataset.data[c.dataIndex] as unknown as typeof data[0];
					const value = v.v;
					const m = max(v.y);
					if (m === 0) {
						return alpha(color, 0);
					} else {
						const a = value / m;
						return alpha(color, a);
					}
				},
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
						callback: (value, index, values) => value,
					},
					title: {
						display: true,
						text: 'Days later',
					},
				},
				y: {
					type: 'time',
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
							return getYYYYMMDD(new Date(new Date(v.y).getTime() + (v.x * 86400000)));
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex] as unknown as typeof data[0];
							const m = max(v.y);
							if (m === 0) {
								return [`Active: ${v.v} (-%)`];
							} else {
								return [`Active: ${v.v} (${Math.round((v.v / m) * 100)}%)`];
							}
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
