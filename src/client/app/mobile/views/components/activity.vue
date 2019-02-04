<template>
<div class="mk-activity">
	<div ref="chart"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import ApexCharts from 'apexcharts';

export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			data: [],
			peak: null
		};
	},
	mounted() {
		this.$root.api('charts/user/notes', {
			userId: this.user.id,
			span: 'day',
			limit: 21
		}).then(stats => {
			const normal = [];
			const reply = [];
			const renote = [];

			const now = new Date();
			const y = now.getFullYear();
			const m = now.getMonth();
			const d = now.getDate();

			for (let i = 0; i < 21; i++) {
				const x = new Date(y, m, d - i);
				normal.push([
					x,
					stats.diffs.normal[i]
				]);
				reply.push([
					x,
					stats.diffs.reply[i]
				]);
				renote.push([
					x,
					stats.diffs.renote[i]
				]);
			}

			const chart = new ApexCharts(this.$refs.chart, {
				chart: {
					type: 'bar',
					stacked: true,
					height: 100,
					sparkline: {
						enabled: true
					},
				},
				plotOptions: {
					bar: {
						columnWidth: '90%'
					}
				},
				grid: {
					clipMarkers: false,
					padding: {
						top: 0,
						right: 8,
						bottom: 0,
						left: 8
					}
				},
				tooltip: {
					shared: true,
					intersect: false
				},
				series: [{
					name: 'Normal',
					data: normal
				}, {
					name: 'Reply',
					data: reply
				}, {
					name: 'Renote',
					data: renote
				}],
				xaxis: {
					type: 'datetime',
					crosshairs: {
						width: 1,
						opacity: 1
					}
				}
			});

			chart.render();
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-activity
	max-width 600px
	margin 0 auto

</style>
