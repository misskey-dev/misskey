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
import { onMounted, nextTick, watch, shallowRef, ref } from 'vue';
import { Chart } from 'chart.js';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { useChartTooltip } from '@/scripts/use-chart-tooltip.js';
import { alpha } from '@/scripts/color.js';
import { initChart } from '@/scripts/init-chart.js';

initChart();

export type HeatmapSource = 'active-users' | 'notes' | 'ap-requests-inbox-received' | 'ap-requests-deliver-succeeded' | 'ap-requests-deliver-failed';

const props = withDefaults(defineProps<{
	src: HeatmapSource;
	user?: Misskey.entities.User;
	label?: string;
}>(), {
	user: undefined,
	label: '',
});

const rootEl = shallowRef<HTMLDivElement | null>(null);
const chartEl = shallowRef<HTMLCanvasElement | null>(null);
const now = new Date();
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

	const wide = rootEl.value.offsetWidth > 700;
	const narrow = rootEl.value.offsetWidth < 400;

	const weeks = wide ? 50 : narrow ? 10 : 25;
	const chartLimit = 7 * weeks;

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr: number[]) => {
		return arr.map((v, i) => {
			const dt = getDate(i);
			const iso = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
			return {
				x: iso,
				y: dt.getDay(),
				d: iso,
				v,
			};
		});
	};

	let values: number[] = [];

	if (props.src === 'active-users') {
		const raw = await misskeyApi('charts/active-users', { limit: chartLimit, span: 'day' });
		values = raw.readWrite;
	} else if (props.src === 'notes') {
		if (props.user) {
			const raw = await misskeyApi('charts/user/notes', { userId: props.user.id, limit: chartLimit, span: 'day' });
			values = raw.inc;
		} else {
			const raw = await misskeyApi('charts/notes', { limit: chartLimit, span: 'day' });
			values = raw.local.inc;
		}
	} else if (props.src === 'ap-requests-inbox-received') {
		const raw = await misskeyApi('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.inboxReceived;
	} else if (props.src === 'ap-requests-deliver-succeeded') {
		const raw = await misskeyApi('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.deliverSucceeded;
	} else if (props.src === 'ap-requests-deliver-failed') {
		const raw = await misskeyApi('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.deliverFailed;
	}

	fetching.value = false;

	await nextTick();

	const color = defaultStore.state.darkMode ? '#b4e900' : '#86b300';

	// 視覚上の分かりやすさのため上から最も大きい3つの値の平均を最大値とする
	const max = values.slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / 3;

	const min = Math.max(0, Math.min(...values) - 1);

	const marginEachCell = 4;

	if (chartEl.value == null) return;

	chartInstance = new Chart(chartEl.value, {
		type: 'matrix',
		data: {
			datasets: [{
				label: props.label,
				data: format(values) as any,
				borderWidth: 0,
				borderRadius: 3,
				backgroundColor(c) {
					// @ts-expect-error TS(2339)
					const value = c.dataset.data[c.dataIndex].v as number;
					let a = (value - min) / max;
					if (value !== 0) { // 0でない限りは完全に不可視にはしない
						a = Math.max(a, 0.05);
					}
					return alpha(color, a);
				},
				width(c) {
					const a = c.chart.chartArea ?? {};
					return (a.right - a.left) / weeks - marginEachCell;
				},
				height(c) {
					const a = c.chart.chartArea ?? {};
					return (a.bottom - a.top) / 7 - marginEachCell;
				},
			/* @see <https://github.com/misskey-dev/misskey/pull/10365#discussion_r1155511107>
			}] satisfies ChartData[],
			 */
			}],
		},
		options: {
			aspectRatio: wide ? 6 : narrow ? 1.8 : 3.2,
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
					type: 'time',
					offset: true,
					position: 'bottom',
					time: {
						unit: 'week',
						round: 'week',
						isoWeekday: 0,
						displayFormats: {
							day: 'M/d',
							month: 'Y/M',
							week: 'M/d',
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
					offset: true,
					reverse: true,
					position: 'right',
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
						callback: (value, index, values) => ['', 'Mon', '', 'Wed', '', 'Fri', ''][value],
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
							// @ts-expect-error TS(2339)
							return context[0].dataset.data[context[0].dataIndex].d;
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex];

							// @ts-expect-error TS(2339)
							return [v.v];
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

watch(() => props.src, () => {
	fetching.value = true;
	renderChart();
});

onMounted(async () => {
	renderChart();
});
</script>
