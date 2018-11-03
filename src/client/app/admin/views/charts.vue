<template>
<div class="qvgidhudpqhjttdhxubzuyrhyzgslujw">
	<header>
		<b>%fa:chart-bar R% %i18n:@title%:</b>
		<select v-model="src">
			<optgroup label="%i18n:@federation%">
				<option value="federation-instances">%i18n:@charts.federation-instances%</option>
				<option value="federation-instances-total">%i18n:@charts.federation-instances-total%</option>
			</optgroup>
			<optgroup label="%i18n:@users%">
				<option value="users">%i18n:@charts.users%</option>
				<option value="users-total">%i18n:@charts.users-total%</option>
			</optgroup>
			<optgroup label="%i18n:@notes%">
				<option value="notes">%i18n:@charts.notes%</option>
				<option value="local-notes">%i18n:@charts.local-notes%</option>
				<option value="remote-notes">%i18n:@charts.remote-notes%</option>
				<option value="notes-total">%i18n:@charts.notes-total%</option>
			</optgroup>
			<optgroup label="%i18n:@drive%">
				<option value="drive-files">%i18n:@charts.drive-files%</option>
				<option value="drive-files-total">%i18n:@charts.drive-files-total%</option>
				<option value="drive">%i18n:@charts.drive%</option>
				<option value="drive-total">%i18n:@charts.drive-total%</option>
			</optgroup>
			<optgroup label="%i18n:@network%">
				<option value="network-requests">%i18n:@charts.network-requests%</option>
				<option value="network-time">%i18n:@charts.network-time%</option>
				<option value="network-usage">%i18n:@charts.network-usage%</option>
			</optgroup>
		</select>
		<div>
			<span @click="span = 'day'" :class="{ active: span == 'day' }">%i18n:@per-day%</span> | <span @click="span = 'hour'" :class="{ active: span == 'hour' }">%i18n:@per-hour%</span>
		</div>
	</header>
	<div ref="chart"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as ApexCharts from 'apexcharts';

const limit = 60;

const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);

export default Vue.extend({
	data() {
		return {
			chart: null,
			src: 'notes',
			span: 'hour',
			chartInstance: null
		};
	},

	computed: {
		data(): any {
			if (this.chart == null) return null;
			switch (this.src) {
				case 'federation-instances': return this.federationInstancesChart(false);
				case 'federation-instances-total': return this.federationInstancesChart(true);
				case 'users': return this.usersChart(false);
				case 'users-total': return this.usersChart(true);
				case 'notes': return this.notesChart('combined');
				case 'local-notes': return this.notesChart('local');
				case 'remote-notes': return this.notesChart('remote');
				case 'notes-total': return this.notesTotalChart();
				case 'drive': return this.driveChart();
				case 'drive-total': return this.driveTotalChart();
				case 'drive-files': return this.driveFilesChart();
				case 'drive-files-total': return this.driveFilesTotalChart();
				case 'network-requests': return this.networkRequestsChart();
				case 'network-time': return this.networkTimeChart();
				case 'network-usage': return this.networkUsageChart();
			}
		},

		stats(): any[] {
			const stats =
				this.span == 'day' ? this.chart.perDay :
				this.span == 'hour' ? this.chart.perHour :
				null;

			return stats;
		}
	},

	watch: {
		src() {
			this.render();
		},

		span() {
			this.render();
		}
	},

	async mounted() {
		this.now = new Date();

		const [perHour, perDay] = await Promise.all([Promise.all([
			(this as any).api('charts/federation', { limit: limit, span: 'hour' }),
			(this as any).api('charts/users', { limit: limit, span: 'hour' }),
			(this as any).api('charts/notes', { limit: limit, span: 'hour' }),
			(this as any).api('charts/drive', { limit: limit, span: 'hour' }),
			(this as any).api('charts/network', { limit: limit, span: 'hour' })
		]), Promise.all([
			(this as any).api('charts/federation', { limit: limit, span: 'day' }),
			(this as any).api('charts/users', { limit: limit, span: 'day' }),
			(this as any).api('charts/notes', { limit: limit, span: 'day' }),
			(this as any).api('charts/drive', { limit: limit, span: 'day' }),
			(this as any).api('charts/network', { limit: limit, span: 'day' })
		])]);

		const chart = {
			perHour: {
				federation: perHour[0],
				users: perHour[1],
				notes: perHour[2],
				drive: perHour[3],
				network: perHour[4]
			},
			perDay: {
				federation: perDay[0],
				users: perDay[1],
				notes: perDay[2],
				drive: perDay[3],
				network: perDay[4]
			}
		};

		this.chart = chart;

		this.render();
	},

	methods: {
		render() {
			if (this.chartInstance) {
				this.chartInstance.destroy();
			}

			this.chartInstance = new ApexCharts(this.$refs.chart, Object.assign({
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
				xaxis: {
					type: 'datetime'
				},
				yaxis: {
				}
			}, this.data));

			this.chartInstance.render();
		},

		getDate(i: number) {
			const y = this.now.getFullYear();
			const m = this.now.getMonth();
			const d = this.now.getDate();
			const h = this.now.getHours();

			return (
				this.span == 'day' ? new Date(y, m, d - i) :
				this.span == 'hour' ? new Date(y, m, d, h - i) :
				null
			);
		},

		format(arr) {
			return arr.map((v, i) => ({ x: this.getDate(i).getTime(), y: v }));
		},

		federationInstancesChart(total: boolean): any {
			return {
				series: [{
					data: this.format(total
						? this.stats.federation.instance.total
						: sum(this.stats.federation.instance.inc, negate(this.stats.federation.instance.dec))
					)
				}]
			};
		},

		notesChart(type: string): any {
			return {
				series: [{
					name: 'All',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.inc, negate(this.stats.notes.local.dec), this.stats.notes.remote.inc, negate(this.stats.notes.remote.dec))
						: sum(this.stats.notes[type].inc, negate(this.stats.notes[type].dec))
					)
				}, {
					name: 'Renotes',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.renote, this.stats.notes.remote.diffs.renote)
						: this.stats.notes[type].diffs.renote
					)
				}, {
					name: 'Replies',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.reply, this.stats.notes.remote.diffs.reply)
						: this.stats.notes[type].diffs.reply
					)
				}, {
					name: 'Normal',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.normal, this.stats.notes.remote.diffs.normal)
						: this.stats.notes[type].diffs.normal
					)
				}]
			};
		},

		notesTotalChart(): any {
			return {
				series: [{
					name: 'Combined',
					data: this.format(sum(this.stats.notes.local.total, this.stats.notes.remote.total))
				}, {
					name: 'Local',
					data: this.format(this.stats.notes.local.total)
				}, {
					name: 'Remote',
					data: this.format(this.stats.notes.remote.total)
				}]
			};
		},

		usersChart(total: boolean): any {
			return {
				series: [{
					name: 'Combined',
					data: this.format(total
						? sum(this.stats.users.local.total, this.stats.users.remote.total)
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec), this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}, {
					name: 'Local',
					data: this.format(total
						? this.stats.users.local.total
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec))
					)
				}, {
					name: 'Remote',
					data: this.format(total
						? this.stats.users.remote.total
						: sum(this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}]
			};
		},

		driveChart(): any {
			return {
				series: [{
					name: 'All',
					data: this.format(
						sum(
							this.stats.drive.local.incSize,
							negate(this.stats.drive.local.decSize),
							this.stats.drive.remote.incSize,
							negate(this.stats.drive.remote.decSize)
						)
					)
				}, {
					name: 'Local +',
					data: this.format(this.stats.drive.local.incSize)
				}, {
					name: 'Local -',
					data: this.format(negate(this.stats.drive.local.decSize))
				}, {
					name: 'Remote +',
					data: this.format(this.stats.drive.remote.incSize)
				}, {
					name: 'Remote -',
					data: this.format(negate(this.stats.drive.remote.decSize))
				}]
			};
		},

		driveTotalChart(): any {
			return {
				series: [{
					name: 'Combined',
					data: this.format(sum(this.stats.drive.local.totalSize, this.stats.drive.remote.totalSize))
				}, {
					name: 'Local',
					data: this.format(this.stats.drive.local.totalSize)
				}, {
					name: 'Remote',
					data: this.format(this.stats.drive.remote.totalSize)
				}]
			};
		},

		driveFilesChart(): any {
			return {
				series: [{
					name: 'All',
					data: this.format(
						sum(
							this.stats.drive.local.incCount,
							negate(this.stats.drive.local.decCount),
							this.stats.drive.remote.incCount,
							negate(this.stats.drive.remote.decCount)
						)
					)
				}, {
					name: 'Local +',
					data: this.format(this.stats.drive.local.incCount)
				}, {
					name: 'Local -',
					data: this.format(negate(this.stats.drive.local.decCount))
				}, {
					name: 'Remote +',
					data: this.format(this.stats.drive.remote.incCount)
				}, {
					name: 'Remote -',
					data: this.format(negate(this.stats.drive.remote.decCount))
				}]
			};
		},

		driveFilesTotalChart(): any {
			return {
				series: [{
					name: 'Combined',
					data: this.format(sum(this.stats.drive.local.totalCount, this.stats.drive.remote.totalCount))
				}, {
					name: 'Local',
					data: this.format(this.stats.drive.local.totalCount)
				}, {
					name: 'Remote',
					data: this.format(this.stats.drive.remote.totalCount)
				}]
			};
		},

		networkRequestsChart(): any {
			return {
				series: [{
					name: 'Incoming',
					data: this.format(this.stats.network.incomingRequests)
				}]
			};
		},

		networkTimeChart(): any {
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push(this.stats.network.incomingRequests[i] != 0 ? (this.stats.network.totalTime[i] / this.stats.network.incomingRequests[i]) : 0);
			}

			return {
				series: [{
					name: 'Avg time',
					data: this.format(data)
				}]
			};
		},

		networkUsageChart(): any {
			return {
				series: [{
					name: 'Incoming',
					data: this.format(this.stats.network.incomingBytes)
				}, {
					name: 'Outgoing',
					data: this.format(this.stats.network.outgoingBytes)
				}]
			};
		},
	}
});
</script>

<style lang="stylus" scoped>
.qvgidhudpqhjttdhxubzuyrhyzgslujw
	display block
	flex 1
	padding 32px
	padding-bottom 0
	box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
	background var(--face)
	border-radius 8px

	> header
		display flex
		padding 0 0 8px 0
		font-size 1em
		color #555
		border-bottom solid 1px #eee

		> b
			margin-right 8px

		> *:last-child
			margin-left auto

			*
				&:not(.active)
					color var(--primary)
					cursor pointer

</style>
