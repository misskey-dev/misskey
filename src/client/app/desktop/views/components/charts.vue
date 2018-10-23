<template>
<div class="gkgckalzgidaygcxnugepioremxvxvpt">
	<header>
		<b>%i18n:@title%:</b>
		<select v-model="chartType">
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
	<div>
		<x-chart v-if="chart" :data="data[0]" :opts="data[1]"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XChart from './charts.chart.ts';

const colors = {
	local: 'rgb(246, 88, 79)',
	remote: 'rgb(65, 221, 222)',

	localPlus: 'rgb(52, 178, 118)',
	remotePlus: 'rgb(158, 255, 209)',
	localMinus: 'rgb(255, 97, 74)',
	remoteMinus: 'rgb(255, 149, 134)',

	incoming: 'rgb(52, 178, 118)',
	outgoing: 'rgb(255, 97, 74)',
};

const rgba = (color: string): string => {
	return color.replace('rgb', 'rgba').replace(')', ', 0.1)');
};

const limit = 35;

const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);

export default Vue.extend({
	components: {
		XChart
	},

	data() {
		return {
			now: null,
			chart: null,
			chartType: 'notes',
			span: 'hour'
		};
	},

	computed: {
		data(): any {
			if (this.chart == null) return null;
			switch (this.chartType) {
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

	async created() {
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
	},

	methods: {
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
			return arr.map((v, i) => ({ t: this.getDate(i).getTime(), y: v }));
		},

		federationInstancesChart(total: boolean): any {
			return [{
				datasets: [{
					label: 'Instances',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(total
						? this.stats.federation.instance.total
						: sum(this.stats.federation.instance.inc, negate(this.stats.federation.instance.dec)))
				}]
			}];
		},

		notesChart(type: string): any {
			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.inc, negate(this.stats.notes.local.dec), this.stats.notes.remote.inc, negate(this.stats.notes.remote.dec))
						: sum(this.stats.notes[type].inc, negate(this.stats.notes[type].dec))
					)
				}, {
					label: 'Renotes',
					fill: true,
					backgroundColor: 'rgba(161, 222, 65, 0.1)',
					borderColor: '#a1de41',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.renote, this.stats.notes.remote.diffs.renote)
						: this.stats.notes[type].diffs.renote
					)
				}, {
					label: 'Replies',
					fill: true,
					backgroundColor: 'rgba(247, 121, 108, 0.1)',
					borderColor: '#f7796c',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.reply, this.stats.notes.remote.diffs.reply)
						: this.stats.notes[type].diffs.reply
					)
				}, {
					label: 'Normal',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.normal, this.stats.notes.remote.diffs.normal)
						: this.stats.notes[type].diffs.normal
					)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('number')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('number')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		notesTotalChart(): any {
			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(sum(this.stats.notes.local.total, this.stats.notes.remote.total))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.notes.local.total)
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.notes.remote.total)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('number')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('number')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		usersChart(total: boolean): any {
			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(total
						? sum(this.stats.users.local.total, this.stats.users.remote.total)
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec), this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(total
						? this.stats.users.local.total
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec))
					)
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(total
						? this.stats.users.remote.total
						: sum(this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('number')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('number')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		driveChart(): any {
			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(sum(this.stats.drive.local.incSize, negate(this.stats.drive.local.decSize), this.stats.drive.remote.incSize, negate(this.stats.drive.remote.decSize)))
				}, {
					label: 'Local +',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.local.incSize)
				}, {
					label: 'Local -',
					fill: true,
					backgroundColor: rgba(colors.localMinus),
					borderColor: colors.localMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(negate(this.stats.drive.local.decSize))
				}, {
					label: 'Remote +',
					fill: true,
					backgroundColor: rgba(colors.remotePlus),
					borderColor: colors.remotePlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.remote.incSize)
				}, {
					label: 'Remote -',
					fill: true,
					backgroundColor: rgba(colors.remoteMinus),
					borderColor: colors.remoteMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(negate(this.stats.drive.remote.decSize))
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('bytes')(value, 1);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('bytes')(tooltipItem.yLabel, 1)}`;
						}
					}
				}
			}];
		},

		driveTotalChart(): any {
			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(sum(this.stats.drive.local.totalSize, this.stats.drive.remote.totalSize))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.local.totalSize)
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.remote.totalSize)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('bytes')(value, 1);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('bytes')(tooltipItem.yLabel, 1)}`;
						}
					}
				}
			}];
		},

		driveFilesChart(): any {
			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(sum(this.stats.drive.local.incCount, negate(this.stats.drive.local.decCount), this.stats.drive.remote.incCount, negate(this.stats.drive.remote.decCount)))
				}, {
					label: 'Local +',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.local.incCount)
				}, {
					label: 'Local -',
					fill: true,
					backgroundColor: rgba(colors.localMinus),
					borderColor: colors.localMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(negate(this.stats.drive.local.decCount))
				}, {
					label: 'Remote +',
					fill: true,
					backgroundColor: rgba(colors.remotePlus),
					borderColor: colors.remotePlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.remote.incCount)
				}, {
					label: 'Remote -',
					fill: true,
					backgroundColor: rgba(colors.remoteMinus),
					borderColor: colors.remoteMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(negate(this.stats.drive.remote.decCount))
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('number')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('number')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		driveFilesTotalChart(): any {
			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(sum(this.stats.drive.local.totalCount, this.stats.drive.remote.totalCount))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.local.totalCount)
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.drive.remote.totalCount)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('number')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('number')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		networkRequestsChart(): any {
			return [{
				datasets: [{
					label: 'Incoming',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.network.incomingRequests)
				}]
			}];
		},

		networkTimeChart(): any {
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push(this.stats.network.incomingRequests[i] != 0 ? (this.stats.network.totalTime[i] / this.stats.network.incomingRequests[i]) : 0);
			}

			return [{
				datasets: [{
					label: 'Avg time (ms)',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(data)
				}]
			}];
		},

		networkUsageChart(): any {
			return [{
				datasets: [{
					label: 'Incoming',
					fill: true,
					backgroundColor: rgba(colors.incoming),
					borderColor: colors.incoming,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.network.incomingBytes)
				}, {
					label: 'Outgoing',
					fill: true,
					backgroundColor: rgba(colors.outgoing),
					borderColor: colors.outgoing,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: this.format(this.stats.network.outgoingBytes)
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('bytes')(value, 1);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('bytes')(tooltipItem.yLabel, 1)}`;
						}
					}
				}
			}];
		},
	}
});
</script>

<style lang="stylus" scoped>
.gkgckalzgidaygcxnugepioremxvxvpt
	padding 32px
	background #fff
	box-shadow 0 2px 8px rgba(#000, 0.1)

	*
		user-select none

	> header
		display flex
		margin 0 0 1em 0
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

	> div
		> *
			display block
			height 350px

</style>
