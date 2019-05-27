<template>
<div>
	<ui-info warn v-if="latestStats && latestStats.waiting > 0">The queue is jammed.</ui-info>
	<ui-horizon-group inputs v-if="latestStats" class="fit-bottom">
		<ui-input :value="latestStats.activeSincePrevTick | number" type="text" readonly>
			<span>Process</span>
			<template #prefix><fa :icon="fasPlayCircle"/></template>
			<template #suffix>jobs/tick</template>
		</ui-input>
		<ui-input :value="latestStats.active | number" type="text" readonly>
			<span>Active</span>
			<template #prefix><fa :icon="farPlayCircle"/></template>
			<template #suffix>jobs</template>
		</ui-input>
		<ui-input :value="latestStats.waiting | number" type="text" readonly>
			<span>Waiting</span>
			<template #prefix><fa :icon="faStopCircle"/></template>
			<template #suffix>jobs</template>
		</ui-input>
		<ui-input :value="latestStats.delayed | number" type="text" readonly>
			<span>Delayed</span>
			<template #prefix><fa :icon="faStopwatch"/></template>
			<template #suffix>jobs</template>
		</ui-input>
	</ui-horizon-group>
	<div ref="chart" class="wptihjuy"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import ApexCharts from 'apexcharts';
import * as tinycolor from 'tinycolor2';
import { faStopwatch, faPlayCircle as fasPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { faStopCircle, faPlayCircle as farPlayCircle } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/queue.vue'),

	props: {
		type: {
			type: String,
			required: true
		},
		connection: {
			required: true
		},
		limit: {
			type: Number,
			required: true
		}
	},

	data() {
		return {
			stats: [],
			chart: null,
			faStopwatch, faStopCircle, farPlayCircle, fasPlayCircle
		};
	},

	computed: {
		latestStats(): any {
			return this.stats.length > 0 ? this.stats[this.stats.length - 1][this.type] : null;
		}
	},

	watch: {
		stats(stats) {
			this.chart.updateSeries([{
				name: 'Process',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x[this.type].activeSincePrevTick }))
			}, {
				name: 'Active',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x[this.type].active }))
			}, {
				name: 'Waiting',
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x[this.type].waiting }))
			}, {
				name: 'Delayed',
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x[this.type].delayed }))
			}]);
		},
	},

	mounted() {
		this.chart = new ApexCharts(this.$refs.chart, {
			chart: {
				id: this.type,
				group: 'queue',
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
				borderColor: 'rgba(0, 0, 0, 0.1)',
				xaxis: {
					lines: {
						show: true,
					}
				},
			},
			stroke: {
				curve: 'straight',
				width: 2
			},
			tooltip: {
				enabled: false
			},
			legend: {
				labels: {
					colors: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--text')).toRgbString()
				},
			},
			series: [] as any,
			colors: ['#00E396', '#00BCD4', '#FFB300', '#e53935'],
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
		});

		this.chart.render();

		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);

		this.$once('hook:beforeDestroy', () => {
			if (this.chart) this.chart.destroy();
		});
	},

	methods: {
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > this.limit) this.stats.shift();
		},

		onStatsLog(statsLog) {
			for (const stats of statsLog.reverse()) {
				this.onStats(stats);
			}
		},
	}
});
</script>

<style lang="stylus" scoped>
.wptihjuy
	min-height 200px !important
	margin 0 -8px -8px -8px

</style>
