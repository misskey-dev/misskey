<template>
<section class="_section">
	<div class="_title"><slot name="title"></slot></div>
	<div class="_content _table">
		<div class="_row">
			<div class="_cell"><div class="_label">Process</div>{{ number(activeSincePrevTick) }}</div>
			<div class="_cell"><div class="_label">Active</div>{{ number(active) }}</div>
			<div class="_cell"><div class="_label">Waiting</div>{{ number(waiting) }}</div>
			<div class="_cell"><div class="_label">Delayed</div>{{ number(delayed) }}</div>
		</div>
	</div>
	<div class="_content" style="margin-bottom: -8px;">
		<canvas ref="chart"></canvas>
	</div>
	<div class="_content" style="max-height: 180px; overflow: auto;">
		<div v-if="jobs.length > 0">
			<div v-for="job in jobs" :key="job[0]">
				<span>{{ job[0] }}</span>
				<span style="margin-left: 8px; opacity: 0.7;">({{ number(job[1]) }} jobs)</span>
			</div>
		</div>
		<span v-else style="opacity: 0.5;">{{ $t('noJobs') }}</span>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Chart from 'chart.js';
import number from '../../filters/number';

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};
import * as os from '@/os';

export default defineComponent({
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
			jobs: [],
			activeSincePrevTick: 0,
			active: 0,
			waiting: 0,
			delayed: 0,
		}
	},

	mounted() {
		this.fetchJobs();

		// TODO: var(--panel)の色が暗いか明るいかで判定する
		const gridColor = this.$pizzax.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

		Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');

		this.chart = new Chart(this.$refs.chart, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'Process',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#00E396',
					backgroundColor: alpha('#00E396', 0.1),
					data: []
				}, {
					label: 'Active',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#00BCD4',
					backgroundColor: alpha('#00BCD4', 0.1),
					data: []
				}, {
					label: 'Waiting',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#FFB300',
					backgroundColor: alpha('#FFB300', 0.1),
					data: []
				}, {
					label: 'Delayed',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#E53935',
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

	beforeUnmount() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
	},

	methods: {
		onStats(stats) {
			this.activeSincePrevTick = stats[this.domain].activeSincePrevTick;
			this.active = stats[this.domain].active;
			this.waiting = stats[this.domain].waiting;
			this.delayed = stats[this.domain].delayed;
			this.chart.data.labels.push('');
			this.chart.data.datasets[0].data.push(stats[this.domain].activeSincePrevTick);
			this.chart.data.datasets[1].data.push(stats[this.domain].active);
			this.chart.data.datasets[2].data.push(stats[this.domain].waiting);
			this.chart.data.datasets[3].data.push(stats[this.domain].delayed);
			if (this.chart.data.datasets[0].data.length > 200) {
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

		fetchJobs() {
			os.api(this.domain === 'inbox' ? 'admin/queue/inbox-delayed' : this.domain === 'deliver' ? 'admin/queue/deliver-delayed' : null, {}).then(jobs => {
				this.jobs = jobs;
			});
		},

		number
	}
});
</script>
