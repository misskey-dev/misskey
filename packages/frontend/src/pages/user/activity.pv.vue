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
import { Chart } from 'chart.js';
import { enUS } from 'date-fns/locale';
import tinycolor from 'tinycolor2';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import 'chartjs-adapter-date-fns';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import gradient from 'chartjs-plugin-gradient';
import { chartVLine } from '@/scripts/chart-vline';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';

initChart();

const props = defineProps<{
	user: misskey.entities.User;
}>();

const chartEl = $ref<HTMLCanvasElement>(null);
const now = new Date();
let chartInstance: Chart = null;
const chartLimit = 30;
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

	const raw = await os.api('charts/user/pv', { userId: props.user.id, limit: chartLimit, span: 'day' });

	const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	const colorUser = '#3498db';
	const colorVisitor = '#2ecc71';

	chartInstance = new Chart(chartEl, {
		type: 'bar',
		data: {
			datasets: [{
				parsing: false,
				label: 'UPV (user)',
				data: format(raw.upv.user).slice().reverse(),
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: colorUser,
				barPercentage: 0.7,
				categoryPercentage: 1,
				fill: true,
			}, {
				parsing: false,
				label: 'UPV (visitor)',
				data: format(raw.upv.visitor).slice().reverse(),
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 4,
				backgroundColor: colorVisitor,
				barPercentage: 0.7,
				categoryPercentage: 1,
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
					stacked: true,
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
						autoSkipPadding: 8,
					},
					adapters: {
						date: {
							locale: enUS,
						},
					},
				},
				y: {
					position: 'left',
					stacked: true,
					suggestedMax: 10,
					grid: {
						display: true,
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
			animation: false,
			plugins: {
				title: {
					display: true,
					text: 'Unique PV',
					padding: {
						left: 0,
						right: 0,
						top: 0,
						bottom: 12,
					},
				},
				legend: {
					display: true,
					position: 'bottom',
					padding: {
						left: 0,
						right: 0,
						top: 8,
						bottom: 0,
					},
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
