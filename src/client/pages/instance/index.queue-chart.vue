<template>
<mk-container :body-togglable="false">
	<template #header><slot name="title"></slot></template>
	<template #func><button class="_button" @click="resume" :disabled="!paused"><fa :icon="faPlay"/></button><button class="_button" @click="pause" :disabled="paused"><fa :icon="faPause"/></button></template>

	<div class="_content _table">
		<div class="_row">
			<div class="_cell"><div class="_label">Process</div>{{ activeSincePrevTick | number }}</div>
			<div class="_cell"><div class="_label">Active</div>{{ active | number }}</div>
			<div class="_cell"><div class="_label">Waiting</div>{{ waiting | number }}</div>
			<div class="_cell"><div class="_label">Delayed</div>{{ delayed | number }}</div>
		</div>
	</div>
	<div class="_content" style="margin-bottom: -8px;">
		<canvas ref="chart"></canvas>
	</div>
</mk-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Chart from 'chart.js';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../../components/ui/container.vue';

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default defineComponent({
	components: {
		MkContainer,
	},

	props: {
		domain: {
			required: true
		},
		connection: {
			required: true
		},
	},

	data() {
		return {
			chart: null,
			activeSincePrevTick: 0,
			active: 0,
			waiting: 0,
			delayed: 0,
			paused: false,
			faPlay, faPause
		}
	},

	mounted() {
		// TODO: var(--panel)の色が暗いか明るいかで判定する
		const gridColor = this.$store.state.device.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

		Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');

		this.chart = new Chart(this.$refs.chart, {
			type: 'bar',
			data: {
				labels: [],
				datasets: [{
					label: 'Process',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 0,
					backgroundColor: '#8BC34A',
					data: []
				}, {
					label: 'Active',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 0,
					backgroundColor: '#03A9F4',
					data: []
				}, {
					label: 'Waiting',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 0,
					backgroundColor: '#FFC107',
					data: []
				}, {
					label: 'Delayed',
					order: -1,
					type: 'line',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#F44336',
					borderDash: [5, 5],
					fill: false,
					data: []
				}]
			},
			options: {
				aspectRatio: 3,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 8,
						bottom: 0
					}
				},
				legend: {
					position: 'bottom',
					labels: {
						boxWidth: 16,
					}
				},
				scales: {
					xAxes: [{
						stacked: true,
						gridLines: {
							display: false,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false
						}
					}],
					yAxes: [{
						stacked: true,
						position: 'right',
						gridLines: {
							display: true,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false,
						}
					}]
				},
				tooltips: {
					intersect: false,
					mode: 'index',
				}
			}
		});

		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
	},

	beforeDestroy() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
	},

	methods: {
		onStats(stats) {
			if (this.paused) return;
			this.activeSincePrevTick = stats[this.domain].activeSincePrevTick;
			this.active = stats[this.domain].active;
			this.waiting = stats[this.domain].waiting;
			this.delayed = stats[this.domain].delayed;
			this.chart.data.labels.push('');
			this.chart.data.datasets[0].data.push(stats[this.domain].activeSincePrevTick);
			this.chart.data.datasets[1].data.push(stats[this.domain].active);
			this.chart.data.datasets[2].data.push(stats[this.domain].waiting);
			this.chart.data.datasets[3].data.push(stats[this.domain].delayed);
			if (this.chart.data.datasets[0].data.length > 100) {
				this.chart.data.labels.shift();
				this.chart.data.datasets[0].data.shift();
				this.chart.data.datasets[1].data.shift();
				this.chart.data.datasets[2].data.shift();
				this.chart.data.datasets[3].data.shift();
			}
			this.chart.update();
		},

		onStatsLog(statsLog) {
			for (const stats of [...statsLog].reverse()) {
				this.onStats(stats);
			}
		},

		pause() {
			this.paused = true;
		},

		resume() {
			this.paused = false;
		},
	}
});
</script>
