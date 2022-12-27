<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root" class="_panel">
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, version as vueVersion, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
} from 'chart.js';
import { enUS } from 'date-fns/locale';
import tinycolor from 'tinycolor2';
import * as os from '@/os';
import 'chartjs-adapter-date-fns';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { chartVLine } from '@/scripts/chart-vline';

Chart.register(
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
	MatrixController, MatrixElement,
);

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const chartEl = $ref<HTMLCanvasElement>(null);
const now = new Date();
let chartInstance: Chart = null;
const weeks = 25;
const chartLimit = 7 * weeks;
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr) => {
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

	const raw = await os.api('charts/active-users', { limit: chartLimit, span: 'day' });

	const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	const color = '#3498db';

	const max = Math.max(...raw.readWrite);

	const marginEachCell = 4;

	chartInstance = new Chart(chartEl, {
		type: 'matrix',
		data: {
			datasets: [{
				label: 'Read & Write',
				data: format(raw.readWrite),
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
					// 20週間
					return (a.right - a.left) / weeks - marginEachCell;
				},
				height(c) {
					const a = c.chart.chartArea ?? {};
					// 7日
					return (a.bottom - a.top) / 7 - marginEachCell;
				},
			}],
		},
		options: {
			aspectRatio: 3.2,
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
							week: 'MMM dd',
						},
					},
					grid: {
						display: false,
						color: gridColor,
						borderColor: 'rgb(0, 0, 0, 0)',
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
						color: gridColor,
						borderColor: 'rgb(0, 0, 0, 0)',
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
			animation: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					callbacks: {
						title() {
							return '';
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex];
							return ['d: ' + v.d, 'v: ' + v.v.toFixed(2)];
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

	fetching = false;
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
