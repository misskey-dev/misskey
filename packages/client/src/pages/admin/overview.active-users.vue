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
import gradient from 'chartjs-plugin-gradient';
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
	gradient,
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
const chartLimit = 50;
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();

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
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: v,
		}));
	};

	const raw = await os.api('charts/active-users', { limit: chartLimit, span: 'day' });

	const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	const color = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--accent')).toHexString();

	const max = Math.max(...raw.read);

	chartInstance = new Chart(chartEl, {
		type: 'line',
		data: {
			//labels: new Array(props.limit).fill(0).map((_, i) => getDate(i).toLocaleString()).slice().reverse(),
			datasets: [{
				parsing: false,
				label: 'active',
				data: format(raw.read).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 2,
				borderColor: color,
				borderJoinStyle: 'round',
				//backgroundColor: alpha(color, 0.1),
				gradient: {
					backgroundColor: {
						axis: 'y',
						colors: {
							0: alpha(color, 0),
							[max]: alpha(color, 0.35),
						},
					},
				},
				barPercentage: 0.9,
				categoryPercentage: 0.9,
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
					offset: false,
					time: {
						stepSize: 1,
						unit: 'day',
					},
					grid: {
						display: false,
						color: gridColor,
						borderColor: 'rgb(0, 0, 0, 0)',
					},
					ticks: {
						display: true,
						maxRotation: 0,
						autoSkipPadding: 16,
					},
					adapters: {
						date: {
							locale: enUS,
						},
					},
					min: getDate(chartLimit).getTime(),
				},
				y: {
					position: 'left',
					suggestedMax: 10,
					grid: {
						display: false,
						color: gridColor,
						borderColor: 'rgb(0, 0, 0, 0)',
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
			elements: {
				point: {
					hoverRadius: 5,
					hoverBorderWidth: 2,
				},
			},
			animation: true,
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
				gradient,
			},
		},
		plugins: [chartVLine(vLineColor)],
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
