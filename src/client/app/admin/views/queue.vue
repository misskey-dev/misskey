<template>
<div>
	<ui-card>
		<template #title><fa :icon="faTasks"/> {{ $t('title') }}</template>
		<section class="wptihjuy">
			<header><fa :icon="faPaperPlane"/> Deliver</header>
			<ui-horizon-group inputs v-if="latestStats" class="fit-bottom">
				<ui-input :value="latestStats.deliver.activeSincePrevTick | number" type="text" readonly>
					<span>Process</span>
					<template #prefix><fa :icon="fasPlayCircle"/></template>
					<template #suffix>jobs/s</template>
				</ui-input>
				<ui-input :value="latestStats.deliver.active | number" type="text" readonly>
					<span>Active</span>
					<template #prefix><fa :icon="farPlayCircle"/></template>
					<template #suffix>jobs</template>
				</ui-input>
				<ui-input :value="latestStats.deliver.waiting | number" type="text" readonly>
					<span>Waiting</span>
					<template #prefix><fa :icon="faStopCircle"/></template>
					<template #suffix>jobs</template>
				</ui-input>
				<ui-input :value="latestStats.deliver.delayed | number" type="text" readonly>
					<span>Delayed</span>
					<template #prefix><fa :icon="faStopwatch"/></template>
					<template #suffix>jobs</template>
				</ui-input>
			</ui-horizon-group>
			<div ref="deliverChart" class="chart"></div>
		</section>
		<section class="wptihjuy">
			<header><fa :icon="faInbox"/> Inbox</header>
			<ui-horizon-group inputs v-if="latestStats" class="fit-bottom">
				<ui-input :value="latestStats.inbox.activeSincePrevTick | number" type="text" readonly>
					<span>Process</span>
					<template #prefix><fa :icon="fasPlayCircle"/></template>
					<template #suffix>jobs/s</template>
				</ui-input>
				<ui-input :value="latestStats.inbox.active | number" type="text" readonly>
					<span>Active</span>
					<template #prefix><fa :icon="farPlayCircle"/></template>
					<template #suffix>jobs</template>
				</ui-input>
				<ui-input :value="latestStats.inbox.waiting | number" type="text" readonly>
					<span>Waiting</span>
					<template #prefix><fa :icon="faStopCircle"/></template>
					<template #suffix>jobs</template>
				</ui-input>
				<ui-input :value="latestStats.inbox.delayed | number" type="text" readonly>
					<span>Delayed</span>
					<template #prefix><fa :icon="faStopwatch"/></template>
					<template #suffix>jobs</template>
				</ui-input>
			</ui-horizon-group>
			<div ref="inboxChart" class="chart"></div>
		</section>
		<section>
			<ui-button @click="removeAllJobs">{{ $t('remove-all-jobs') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import ApexCharts from 'apexcharts';
import * as tinycolor from 'tinycolor2';
import { faTasks, faInbox, faStopwatch, faPlayCircle as fasPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane, faStopCircle, faPlayCircle as farPlayCircle } from '@fortawesome/free-regular-svg-icons';

const limit = 150;

export default Vue.extend({
	i18n: i18n('admin/views/queue.vue'),

	data() {
		return {
			stats: [],
			deliverChart: null,
			inboxChart: null,
			faTasks, faPaperPlane, faInbox, faStopwatch, faStopCircle, farPlayCircle, fasPlayCircle
		};
	},

	computed: {
		latestStats(): any {
			return this.stats[this.stats.length - 1];
		}
	},

	watch: {
		stats(stats) {
			this.inboxChart.updateSeries([{
				name: 'Process',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.activeSincePrevTick }))
			}, {
				name: 'Active',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.active }))
			}, {
				name: 'Waiting',
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.waiting }))
			}, {
				name: 'Delayed',
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.inbox.delayed }))
			}]);
			this.deliverChart.updateSeries([{
				name: 'Process',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.activeSincePrevTick }))
			}, {
				name: 'Active',
				type: 'area',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.active }))
			}, {
				name: 'Waiting',
				type: 'line',
				data: stats.map((x, i) => ({ x: i, y: x.deliver.waiting }))
			}, {
				name: 'Delayed',
				type: 'line',
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
		};

		this.inboxChart = new ApexCharts(this.$refs.inboxChart, chartOpts);
		this.deliverChart = new ApexCharts(this.$refs.deliverChart, chartOpts);

		this.inboxChart.render();
		this.deliverChart.render();

		const connection = this.$root.stream.useSharedConnection('queueStats');
		connection.on('stats', this.onStats);
		connection.on('statsLog', this.onStatsLog);
		connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: limit
		});

		this.$once('hook:beforeDestroy', () => {
			connection.dispose();
			this.inboxChart.destroy();
			this.deliverChart.destroy();
		});
	},

	methods: {
		async removeAllJobs() {
			const process = async () => {
				await this.$root.api('admin/queue/clear');
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});
		},

		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > limit) this.stats.shift();
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
.wptihjuy
	> .chart
		min-height 200px !important

</style>
