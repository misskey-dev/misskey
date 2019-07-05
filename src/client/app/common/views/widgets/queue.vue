<template>
<div>
	<ui-container :show-header="!props.compact">
		<template #header><fa :icon="faTasks"/>Queue</template>

		<div class="mntrproz">
			<div>
				<b>In</b>
				<span v-if="latestStats">{{ latestStats.inbox.activeSincePrevTick | number }} / {{ latestStats.inbox.delayed | number }}</span>
				<div ref="in"></div>
			</div>
			<div>
				<b>Out</b>
				<span v-if="latestStats">{{ latestStats.deliver.activeSincePrevTick | number }} / {{ latestStats.deliver.delayed | number }}</span>
				<div ref="out"></div>
			</div>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../define-widget';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import ApexCharts from 'apexcharts';

export default define({
	name: 'queue',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			stats: [],
			inChart: null,
			outChart: null,
			faTasks
		};
	},

	watch: {
		stats(stats) {
			this.inChart.updateSeries([{
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.activeSincePrevTick }))
			}, {
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.active }))
			}, {
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.waiting }))
			}, {
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.delayed }))
			}]);
			this.outChart.updateSeries([{
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.activeSincePrevTick }))
			}, {
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.active }))
			}, {
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.waiting }))
			}, {
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.delayed }))
			}]);
		}
	},

	computed: {
		latestStats(): any {
			return this.stats[this.stats.length - 1];
		}
	},

	mounted() {
		const chartOpts = {
			chart: {
				type: 'area',
				height: 70,
				animations: {
					dynamicAnimation: {
						enabled: false
					}
				},
				sparkline: {
					enabled: true,
				}
			},
			dataLabels: {
				enabled: false
			},
			tooltip: {
				enabled: false
			},
			stroke: {
				curve: 'straight',
				width: 1
			},
			colors: ['#00E396', '#00BCD4', '#FFB300', '#e53935'],
			series: [{ data: [] }, { data: [] }, { data: [] }, { data: [] }] as any,
			yaxis: {
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
			length: 50
		});

		this.$once('hook:beforeDestroy', () => {
			connection.dispose();
			this.inChart.destroy();
			this.outChart.destroy();
		});
	},

	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},

		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 50) this.stats.shift();
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
.mntrproz
	display flex
	padding 4px

	> div
		width 50%
		padding 4px

		> b
			display block
			font-size 12px
			color var(--text)

		> span
			position absolute
			top 4px
			right 4px
			opacity 0.7
			font-size 12px
			color var(--text)

</style>
