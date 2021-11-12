<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
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
import number from '@/filters/number';
import * as os from '@/os';
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
);

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default defineComponent({
	props: {
		domain: {
			type: String,
			required: true,
		},
		connection: {
			required: true,
		},
	},

	setup(props) {
		const chartEl = ref<HTMLCanvasElement>(null);

		const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

		// フォントカラー
		Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

		onMounted(() => {
			const chartInstance = new Chart(chartEl.value, {
				type: 'line',
				data: {
					labels: [],
					datasets: [{
						label: 'Process',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderJoinStyle: 'round',
						borderColor: '#00E396',
						backgroundColor: alpha('#00E396', 0.1),
						data: []
					}, {
						label: 'Active',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderJoinStyle: 'round',
						borderColor: '#00BCD4',
						backgroundColor: alpha('#00BCD4', 0.1),
						data: []
					}, {
						label: 'Waiting',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderJoinStyle: 'round',
						borderColor: '#FFB300',
						backgroundColor: alpha('#FFB300', 0.1),
						yAxisID: 'y2',
						data: []
					}, {
						label: 'Delayed',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderJoinStyle: 'round',
						borderColor: '#E53935',
						borderDash: [5, 5],
						fill: false,
						yAxisID: 'y2',
						data: []
					}],
				},
				options: {
					aspectRatio: 2.5,
					layout: {
						padding: {
							left: 16,
							right: 16,
							top: 16,
							bottom: 8,
						},
					},
					scales: {
						x: {
							grid: {
								display: true,
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
							ticks: {
								display: false,
								maxTicksLimit: 10
							},
						},
						y: {
							min: 0,
							stack: 'queue',
							stackWeight: 2,
							grid: {
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
						},
						y2: {
							min: 0,
							offset: true,
							stack: 'queue',
							stackWeight: 1,
							grid: {
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
						},
					},
					interaction: {
						intersect: false,
					},
					plugins: {
						legend: {
							position: 'bottom',
							labels: {
								boxWidth: 16,
							},
						},
						tooltip: {
							mode: 'index',
							animation: {
								duration: 0,
							},
						},
					},
				},
			});

			const onStats = (stats) => {
				chartInstance.data.labels.push('');
				chartInstance.data.datasets[0].data.push(stats[props.domain].activeSincePrevTick);
				chartInstance.data.datasets[1].data.push(stats[props.domain].active);
				chartInstance.data.datasets[2].data.push(stats[props.domain].waiting);
				chartInstance.data.datasets[3].data.push(stats[props.domain].delayed);
				if (chartInstance.data.datasets[0].data.length > 200) {
					chartInstance.data.labels.shift();
					chartInstance.data.datasets[0].data.shift();
					chartInstance.data.datasets[1].data.shift();
					chartInstance.data.datasets[2].data.shift();
					chartInstance.data.datasets[3].data.shift();
				}
				chartInstance.update();
			};

			const onStatsLog = (statsLog) => {
				for (const stats of [...statsLog].reverse()) {
					chartInstance.data.labels.push('');
					chartInstance.data.datasets[0].data.push(stats[props.domain].activeSincePrevTick);
					chartInstance.data.datasets[1].data.push(stats[props.domain].active);
					chartInstance.data.datasets[2].data.push(stats[props.domain].waiting);
					chartInstance.data.datasets[3].data.push(stats[props.domain].delayed);
					if (chartInstance.data.datasets[0].data.length > 200) {
						chartInstance.data.labels.shift();
						chartInstance.data.datasets[0].data.shift();
						chartInstance.data.datasets[1].data.shift();
						chartInstance.data.datasets[2].data.shift();
						chartInstance.data.datasets[3].data.shift();
					}
				}
				chartInstance.update();
			};

			props.connection.on('stats', onStats);
			props.connection.on('statsLog', onStatsLog);

			onUnmounted(() => {
				props.connection.off('stats', onStats);
				props.connection.off('statsLog', onStatsLog);
			});
		});

		return {
			chartEl,
		}
	},
});
</script>

<style lang="scss" scoped>

</style>
