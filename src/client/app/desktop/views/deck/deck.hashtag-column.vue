<template>
<x-column>
	<template #header>
		<fa icon="hashtag"/><span>{{ tag }}</span>
	</template>

	<div class="xroyrflcmhhtmlwmyiwpfqiirqokfueb">
		<div ref="chart" class="chart"></div>
		<x-hashtag-tl :tag-tl="tagTl" class="tl"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XHashtagTl from './deck.hashtag-tl.vue';
import ApexCharts from 'apexcharts';

export default Vue.extend({
	components: {
		XColumn,
		XHashtagTl
	},

	computed: {
		tag(): string {
			return this.$route.params.tag;
		},

		tagTl(): any {
			return {
				query: [[this.tag]]
			};
		}
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$root.api('charts/hashtag', {
				tag: this.tag,
				span: 'hour',
				limit: 24
			}).then(stats => {
				const local = [];
				const remote = [];

				const now = new Date();
				const y = now.getFullYear();
				const m = now.getMonth();
				const d = now.getDate();
				const h = now.getHours();

				for (let i = 0; i < 24; i++) {
					const x = new Date(y, m, d, h - i);
					local.push([x, stats.local.count[i]]);
					remote.push([x, stats.remote.count[i]]);
				}

				const chart = new ApexCharts(this.$refs.chart, {
					chart: {
						type: 'area',
						height: 70,
						sparkline: {
							enabled: true
						},
					},
					grid: {
						clipMarkers: false,
						padding: {
							top: 16,
							right: 16,
							bottom: 16,
							left: 16
						}
					},
					stroke: {
						curve: 'straight',
						width: 2
					},
					series: [{
						name: 'Local',
						data: local
					}, {
						name: 'Remote',
						data: remote
					}],
					xaxis: {
						type: 'datetime',
					}
				});

				chart.render();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.xroyrflcmhhtmlwmyiwpfqiirqokfueb
	background var(--deckColumnBg)

	> .chart
		margin-bottom 16px
		background var(--face)

	> .tl
		background var(--face)

</style>
