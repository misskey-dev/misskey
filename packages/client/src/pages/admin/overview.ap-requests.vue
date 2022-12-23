<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root">
		<div class="chart _panel">
			<canvas ref="chartEl"></canvas>
		</div>
	</div>
</div>
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
} from 'chart.js';
import gradient from 'chartjs-plugin-gradient';
import { enUS } from 'date-fns/locale';
import tinycolor from 'tinycolor2';
import MkMiniChart from '@/components/MkMiniChart.vue';
import * as os from '@/os';
import number from '@/filters/number';
import MkNumberDiff from '@/components/MkNumberDiff.vue';
import { i18n } from '@/i18n';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { chartVLine } from '@/scripts/chart-vline';
import { defaultStore } from '@/store';

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
	
const chartLimit = 50;
const chartEl = $ref<HTMLCanvasElement>();
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();
	
onMounted(async () => {
	const now = new Date();

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

	const formatMinus = (arr) => {
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: -v,
		}));
	};

	const raw = await os.api('charts/ap-request', { limit: chartLimit, span: 'day' });

	const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
	const succColor = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--success')).toHexString();
	const failColor = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--error')).toHexString();

	const succMax = Math.max(...raw.deliverSucceeded);
	const failMax = Math.max(...raw.deliverFailed);

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	new Chart(chartEl, {
		type: 'bar',
		data: {
			//labels: new Array(props.limit).fill(0).map((_, i) => getDate(i).toLocaleString()).slice().reverse(),
			datasets: [{
				stack: 'a',
				parsing: false,
				label: 'Succ',
				data: format(raw.deliverSucceeded).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				//backgroundColor: alpha(color, 0.1),
				gradient: {
					backgroundColor: {
						axis: 'y',
						colors: {
							0: alpha(succColor, 0.3),
							[succMax]: alpha(succColor, 1),
						},
					},
				},
				barPercentage: 0.9,
				categoryPercentage: 0.9,
				fill: true,
				clip: 8,
			}, {
				stack: 'a',
				parsing: false,
				label: 'Fail',
				data: formatMinus(raw.deliverFailed).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				//backgroundColor: alpha(color, 0.1),
				gradient: {
					backgroundColor: {
						axis: 'y',
						colors: {
							0: alpha(failColor, 0.3),
							[-failMax]: alpha(failColor, 1),
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
					stacked: true,
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
					stacked: true,
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
});
</script>

<style lang="scss" module>
.root {

	&:global {
		> .chart {
			padding: 16px;
			margin-bottom: 16px;
		}
	}
}
</style>

