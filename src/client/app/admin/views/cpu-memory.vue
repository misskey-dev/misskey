<template>
<div class="zyknedwtlthezamcjlolyusmipqmjgxz">
	<div ref="cpu"></div>
	<div ref="mem"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as ApexCharts from 'apexcharts';

export default Vue.extend({
	props: ['connection'],

	data() {
		return {
			stats: [],
			cpuChart: null,
			memChart: null,
			cpuP: '',
			memP: ''
		};
	},

	watch: {
		stats(stats) {
			this.cpuChart.updateSeries([{
				data: stats.map((x, i) => ({ x: i, y: x.cpu_usage }))
			}]);
			this.memChart.updateSeries([{
				data: stats.map((x, i) => ({ x: i, y: (x.mem.used / x.mem.total) }))
			}]);
		}
	},

	mounted() {
		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
		this.connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 200
		});

		const chartOpts = {
			chart: {
				type: 'area',
				height: 300,
				animations: {
					dynamicAnimation: {
						enabled: false
					}
				},
				toolbar: {
					show: false
				}
			},
			dataLabels: {
				enabled: false
			},
			grid: {
				clipMarkers: false,
			},
			stroke: {
				curve: 'straight',
				width: 2
			},
			series: [{
				data: []
			}],
			xaxis: {
				type: 'numeric',
				labels: {
					show: false
				}
			},
			yaxis: {
				show: false,
				min: 0,
				max: 1
			}
		};

		this.cpuChart = new ApexCharts(this.$refs.cpu, Object.assign({}, chartOpts, {
			title: {
				text: 'CPU'
			}
		}));
		this.memChart = new ApexCharts(this.$refs.mem, Object.assign({}, chartOpts, {
			title: {
				text: 'MEM'
			}
		}));

		this.cpuChart.render();
		this.memChart.render();
	},

	beforeDestroy() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
	},

	methods: {
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 200) this.stats.shift();

			this.cpuP = (stats.cpu_usage * 100).toFixed(0);
			this.memP = (stats.mem.used / stats.mem.total * 100).toFixed(0);
		},

		onStatsLog(statsLog) {
			statsLog.reverse().forEach(stats => this.onStats(stats));
		}
	}
});
</script>

<style lang="stylus" scoped>
.zyknedwtlthezamcjlolyusmipqmjgxz
	display flex

	> div
		display block
		flex 1
		padding 32px
		box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
		background var(--face)
		border-radius 8px

		&:first-child
			margin-right 16px

</style>
