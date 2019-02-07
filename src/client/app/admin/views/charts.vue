<template>
<div class="qvgidhudpqhjttdhxubzuyrhyzgslujw">
	<header>
		<b><fa :icon="['far', 'chart-bar']"/> {{ $t('title') }}:</b>
		<select v-model="src">
			<optgroup :label="$t('federation')">
				<option value="federation-instances">{{ $t('charts.federation-instances') }}</option>
				<option value="federation-instances-total">{{ $t('charts.federation-instances-total') }}</option>
			</optgroup>
			<optgroup :label="$t('users')">
				<option value="users">{{ $t('charts.users') }}</option>
				<option value="users-total">{{ $t('charts.users-total') }}</option>
				<option value="active-users">{{ $t('charts.active-users') }}</option>
			</optgroup>
			<optgroup :label="$t('notes')">
				<option value="notes">{{ $t('charts.notes') }}</option>
				<option value="local-notes">{{ $t('charts.local-notes') }}</option>
				<option value="remote-notes">{{ $t('charts.remote-notes') }}</option>
				<option value="notes-total">{{ $t('charts.notes-total') }}</option>
			</optgroup>
			<optgroup :label="$t('drive')">
				<option value="drive-files">{{ $t('charts.drive-files') }}</option>
				<option value="drive-files-total">{{ $t('charts.drive-files-total') }}</option>
				<option value="drive">{{ $t('charts.drive') }}</option>
				<option value="drive-total">{{ $t('charts.drive-total') }}</option>
			</optgroup>
			<optgroup :label="$t('network')">
				<option value="network-requests">{{ $t('charts.network-requests') }}</option>
				<option value="network-time">{{ $t('charts.network-time') }}</option>
				<option value="network-usage">{{ $t('charts.network-usage') }}</option>
			</optgroup>
		</select>
		<div>
			<span @click="span = 'day'" :class="{ active: span == 'day' }">{{ $t('per-day') }}</span> | <span @click="span = 'hour'" :class="{ active: span == 'hour' }">{{ $t('per-hour') }}</span>
		</div>
	</header>
	<div ref="chart"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import * as tinycolor from 'tinycolor2';
import ApexCharts from 'apexcharts';

const limit = 90;

const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);

export default Vue.extend({
	i18n: i18n('admin/views/charts.vue'),
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
				case 'active-users': return this.activeUsersChart();
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
			this.$root.api('charts/federation', { limit: limit, span: 'hour' }),
			this.$root.api('charts/users', { limit: limit, span: 'hour' }),
			this.$root.api('charts/active-users', { limit: limit, span: 'hour' }),
			this.$root.api('charts/notes', { limit: limit, span: 'hour' }),
			this.$root.api('charts/drive', { limit: limit, span: 'hour' }),
			this.$root.api('charts/network', { limit: limit, span: 'hour' })
		]), Promise.all([
			this.$root.api('charts/federation', { limit: limit, span: 'day' }),
			this.$root.api('charts/users', { limit: limit, span: 'day' }),
			this.$root.api('charts/active-users', { limit: limit, span: 'day' }),
			this.$root.api('charts/notes', { limit: limit, span: 'day' }),
			this.$root.api('charts/drive', { limit: limit, span: 'day' }),
			this.$root.api('charts/network', { limit: limit, span: 'day' })
		])]);

		const chart = {
			perHour: {
				federation: perHour[0],
				users: perHour[1],
				activeUsers: perHour[2],
				notes: perHour[3],
				drive: perHour[4],
				network: perHour[5]
			},
			perDay: {
				federation: perDay[0],
				users: perDay[1],
				activeUsers: perDay[2],
				notes: perDay[3],
				drive: perDay[4],
				network: perDay[5]
			}
		};

		this.chart = chart;

		this.render();
	},

	beforeDestroy() {
		this.chartInstance.destroy();
	},

	methods: {
		setSrc(src) {
			this.src = src;
		},

		render() {
			if (this.chartInstance) {
				this.chartInstance.destroy();
			}

			this.chartInstance = new ApexCharts(this.$refs.chart, {
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
				legend: {
					labels: {
						colors: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--text')).toRgbString()
					},
				},
				xaxis: {
					type: 'datetime',
					labels: {
						style: {
							colors: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--text')).toRgbString()
						}
					},
					axisBorder: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					axisTicks: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
				},
				yaxis: {
					labels: {
						formatter: this.data.bytes ? v => Vue.filter('bytes')(v, 0) : v => Vue.filter('number')(v),
						style: {
							color: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--text')).toRgbString()
						}
					}
				},
				series: this.data.series
			});

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
					type: 'line',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.inc, negate(this.stats.notes.local.dec), this.stats.notes.remote.inc, negate(this.stats.notes.remote.dec))
						: sum(this.stats.notes[type].inc, negate(this.stats.notes[type].dec))
					)
				}, {
					name: 'Renotes',
					type: 'area',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.renote, this.stats.notes.remote.diffs.renote)
						: this.stats.notes[type].diffs.renote
					)
				}, {
					name: 'Replies',
					type: 'area',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.reply, this.stats.notes.remote.diffs.reply)
						: this.stats.notes[type].diffs.reply
					)
				}, {
					name: 'Normal',
					type: 'area',
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
					type: 'line',
					data: this.format(sum(this.stats.notes.local.total, this.stats.notes.remote.total))
				}, {
					name: 'Local',
					type: 'area',
					data: this.format(this.stats.notes.local.total)
				}, {
					name: 'Remote',
					type: 'area',
					data: this.format(this.stats.notes.remote.total)
				}]
			};
		},

		usersChart(total: boolean): any {
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: this.format(total
						? sum(this.stats.users.local.total, this.stats.users.remote.total)
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec), this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}, {
					name: 'Local',
					type: 'area',
					data: this.format(total
						? this.stats.users.local.total
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec))
					)
				}, {
					name: 'Remote',
					type: 'area',
					data: this.format(total
						? this.stats.users.remote.total
						: sum(this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}]
			};
		},

		activeUsersChart(): any {
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: this.format(sum(this.stats.activeUsers.local.count, this.stats.activeUsers.remote.count))
				}, {
					name: 'Local',
					type: 'area',
					data: this.format(this.stats.activeUsers.local.count)
				}, {
					name: 'Remote',
					type: 'area',
					data: this.format(this.stats.activeUsers.remote.count)
				}]
			};
		},

		driveChart(): any {
			return {
				bytes: true,
				series: [{
					name: 'All',
					type: 'line',
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
					type: 'area',
					data: this.format(this.stats.drive.local.incSize)
				}, {
					name: 'Local -',
					type: 'area',
					data: this.format(negate(this.stats.drive.local.decSize))
				}, {
					name: 'Remote +',
					type: 'area',
					data: this.format(this.stats.drive.remote.incSize)
				}, {
					name: 'Remote -',
					type: 'area',
					data: this.format(negate(this.stats.drive.remote.decSize))
				}]
			};
		},

		driveTotalChart(): any {
			return {
				bytes: true,
				series: [{
					name: 'Combined',
					type: 'line',
					data: this.format(sum(this.stats.drive.local.totalSize, this.stats.drive.remote.totalSize))
				}, {
					name: 'Local',
					type: 'area',
					data: this.format(this.stats.drive.local.totalSize)
				}, {
					name: 'Remote',
					type: 'area',
					data: this.format(this.stats.drive.remote.totalSize)
				}]
			};
		},

		driveFilesChart(): any {
			return {
				series: [{
					name: 'All',
					type: 'line',
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
					type: 'area',
					data: this.format(this.stats.drive.local.incCount)
				}, {
					name: 'Local -',
					type: 'area',
					data: this.format(negate(this.stats.drive.local.decCount))
				}, {
					name: 'Remote +',
					type: 'area',
					data: this.format(this.stats.drive.remote.incCount)
				}, {
					name: 'Remote -',
					type: 'area',
					data: this.format(negate(this.stats.drive.remote.decCount))
				}]
			};
		},

		driveFilesTotalChart(): any {
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: this.format(sum(this.stats.drive.local.totalCount, this.stats.drive.remote.totalCount))
				}, {
					name: 'Local',
					type: 'area',
					data: this.format(this.stats.drive.local.totalCount)
				}, {
					name: 'Remote',
					type: 'area',
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
				bytes: true,
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
	padding 32px 24px
	padding-bottom 0
	box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
	background var(--face)
	border-radius 8px

	> header
		display flex
		margin 0 8px
		padding 0 0 8px 0
		font-size 1em
		color var(--adminDashboardCardFg)
		border-bottom solid 1px var(--adminDashboardCardDivider)

		> b
			margin-right 8px

		> *:last-child
			margin-left auto

			*
				&:not(.active)
					color var(--primary)
					cursor pointer

</style>
