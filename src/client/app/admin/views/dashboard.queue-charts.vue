<template>
<div class="mzxlfysy">
	<div>
		<header>
			<span><fa :icon="faInbox"/> In</span>
			<span v-if="latestStats">{{ latestStats.inbox.activeSincePrevTick | number }} / {{ latestStats.inbox.delayed | number }}</span>
		</header>
		<div ref="in"></div>
	</div>
	<div>
		<header>
			<span><fa :icon="faPaperPlane"/> Out</span>
			<span v-if="latestStats">{{ latestStats.deliver.activeSincePrevTick | number }} / {{ latestStats.deliver.delayed | number }}</span>
		</header>
		<div ref="out"></div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import ApexCharts from 'apexcharts';

export default Vue.extend({
	data() {
		return {
			stats: [],
			inChart: null,
			outChart: null,
			faInbox, faPaperPlane
		};
	},

	computed: {
		latestStats(): any {
			return this.stats[this.stats.length - 1];
		}
	},

	watch: {
		stats(stats) {
			this.inChart.updateSeries([{
				data: stats.map((x, i) => ({ x: i, y: x.inbox.activeSincePrevTick }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.inbox.active }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.inbox.waiting }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.inbox.delayed }))
			}]);
			this.outChart.updateSeries([{
				data: stats.map((x, i) => ({ x: i, y: x.deliver.activeSincePrevTick }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.deliver.active }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.deliver.waiting }))
			}, {
				data: stats.map((x, i) => ({ x: i, y: x.deliver.delayed }))
			}]);
		}
	},

	mounted() {
		const chartOpts = {
			chart: {
				type: 'area',
				height: 200,
				animations: {
					dynamicAnimation: {
						enabled: false
					}
				},
				toolbar: {
					show: false
				},
				zoom: {
					enabled: false
				}
			},
			dataLabels: {
				enabled: false
			},
			grid: {
				clipMarkers: false,
				borderColor: 'rgba(0, 0, 0, 0.1)'
			},
			stroke: {
				curve: 'straight',
				width: 2
			},
			tooltip: {
				enabled: false
			},
			legend: {
				show: false
			},
			colors: ['#00E396', '#00BCD4', '#FFB300', '#e53935'],
			series: [{ data: [] }, { data: [] }, { data: [] }, { data: [] }] as any,
			xaxis: {
				type: 'numeric',
				labels: {
					show: false
				},
				tooltip: {
					enabled: false
				}
			},
			yaxis: {
				show: false,
				min: 0,
			}
		};

		this.inChart = new ApexCharts(this.$refs.in, chartOpts);
		this.outChart = new ApexCharts(this.$refs.out, chartOpts);

		this.inChart.render();
		this.outChart.render();

		const connection = this.$root.stream.useSharedConnection('queueStats');
		connection.on('stats', this.onStats);
		connection.on('statsLog', this.onStatsLog);
		connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 100
		});

		this.$once('hook:beforeDestroy', () => {
			connection.dispose();
			this.inChart.destroy();
			this.outChart.destroy();
		});
	},

	methods: {
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 100) this.stats.shift();
		},

		onStatsLog(statsLog) {
			for (const stats of statsLog.reverse()) {
				this.onStats(stats);
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mzxlfysy
	display flex

	> div
		display block
		flex 1
		padding 20px 12px 0 12px
		box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
		background var(--face)
		border-radius 8px

		&:first-child
			margin-right 16px

		> header
			display flex
			padding 0 8px
			margin-bottom -16px
			color var(--adminDashboardCardFg)
			font-size 14px

			> span
				&:last-child
					margin-left auto
					opacity 0.7

				> span
					opacity 0.7

		> div
			margin-bottom -10px

	@media (max-width 1000px)
		display block
		margin-bottom 26px

		> div
			&:first-child
				margin-right 0
				margin-bottom 26px

</style>
