<template>
<div class="gkgckalzgidaygcxnugepioremxvxvpt">
	<header>
		<b>%i18n:@title%:</b>
		<select v-model="chartType">
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
			(this as any).api('charts/users', { limit: limit, span: 'hour' }),
			(this as any).api('charts/notes', { limit: limit, span: 'hour' }),
			(this as any).api('charts/drive', { limit: limit, span: 'hour' }),
			(this as any).api('charts/network', { limit: limit, span: 'hour' })
		]), Promise.all([
			(this as any).api('charts/users', { limit: limit, span: 'day' }),
			(this as any).api('charts/notes', { limit: limit, span: 'day' }),
			(this as any).api('charts/drive', { limit: limit, span: 'day' }),
			(this as any).api('charts/network', { limit: limit, span: 'day' })
		])]);

		const chart = {
			perHour: {
				users: perHour[0],
				notes: perHour[1],
				drive: perHour[2],
				network: perHour[3]
			},
			perDay: {
				users: perDay[0],
				notes: perDay[1],
				drive: perDay[2],
				network: perDay[3]
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

		notesChart(type: string): any {
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					normal: type == 'local' ? this.stats.notes.local.diffs.normal[i] : type == 'remote' ? this.stats.notes.remote.diffs.normal[i] : this.stats.notes.local.diffs.normal[i] + this.stats.notes.remote.diffs.normal[i],
					reply: type == 'local' ? this.stats.notes.local.diffs.reply[i] : type == 'remote' ? this.stats.notes.remote.diffs.reply[i] : this.stats.notes.local.diffs.reply[i] + this.stats.notes.remote.diffs.reply[i],
					renote: type == 'local' ? this.stats.notes.local.diffs.renote[i] : type == 'remote' ? this.stats.notes.remote.diffs.renote[i] : this.stats.notes.local.diffs.renote[i] + this.stats.notes.remote.diffs.renote[i],
					all: type == 'local' ? (this.stats.notes.local.inc[i] + -this.stats.notes.local.dec[i]) : type == 'remote' ? (this.stats.notes.remote.inc[i] + -this.stats.notes.remote.dec[i]) : (this.stats.notes.local.inc[i] + -this.stats.notes.local.dec[i]) + (this.stats.notes.remote.inc[i] + -this.stats.notes.remote.dec[i])
				});
			}

			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.all }))
				}, {
					label: 'Renotes',
					fill: true,
					backgroundColor: 'rgba(161, 222, 65, 0.1)',
					borderColor: '#a1de41',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.renote }))
				}, {
					label: 'Replies',
					fill: true,
					backgroundColor: 'rgba(247, 121, 108, 0.1)',
					borderColor: '#f7796c',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.reply }))
				}, {
					label: 'Normal',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.normal }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localCount: this.stats.notes.local.total[i],
					remoteCount: this.stats.notes.remote.total[i]
				});
			}

			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount + x.localCount }))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localCount: total ? this.stats.users.local.total[i] : (this.stats.users.local.inc[i] + -this.stats.users.local.dec[i]),
					remoteCount: total ? this.stats.users.remote.total[i] : (this.stats.users.remote.inc[i] + -this.stats.users.remote.dec[i])
				});
			}

			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount + x.localCount }))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localInc: this.stats.drive.local.incSize[i],
					localDec: -this.stats.drive.local.decSize[i],
					remoteInc: this.stats.drive.remote.incSize[i],
					remoteDec: -this.stats.drive.remote.decSize[i],
				});
			}

			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localInc + x.localDec + x.remoteInc + x.remoteDec }))
				}, {
					label: 'Local +',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localInc }))
				}, {
					label: 'Local -',
					fill: true,
					backgroundColor: rgba(colors.localMinus),
					borderColor: colors.localMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localDec }))
				}, {
					label: 'Remote +',
					fill: true,
					backgroundColor: rgba(colors.remotePlus),
					borderColor: colors.remotePlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteInc }))
				}, {
					label: 'Remote -',
					fill: true,
					backgroundColor: rgba(colors.remoteMinus),
					borderColor: colors.remoteMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteDec }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localSize: this.stats.drive.local.totalSize[i],
					remoteSize: this.stats.drive.remote.totalSize[i]
				});
			}

			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteSize + x.localSize }))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localSize }))
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteSize }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localInc: this.stats.drive.local.incCount[i],
					localDec: -this.stats.drive.local.decCount[i],
					remoteInc: this.stats.drive.remote.incCount[i],
					remoteDec: -this.stats.drive.remote.decCount[i]
				});
			}

			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localInc + x.localDec + x.remoteInc + x.remoteDec }))
				}, {
					label: 'Local +',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localInc }))
				}, {
					label: 'Local -',
					fill: true,
					backgroundColor: rgba(colors.localMinus),
					borderColor: colors.localMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localDec }))
				}, {
					label: 'Remote +',
					fill: true,
					backgroundColor: rgba(colors.remotePlus),
					borderColor: colors.remotePlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteInc }))
				}, {
					label: 'Remote -',
					fill: true,
					backgroundColor: rgba(colors.remoteMinus),
					borderColor: colors.remoteMinus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteDec }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					localCount: this.stats.drive.local.totalCount[i],
					remoteCount: this.stats.drive.remote.totalCount[i],
				});
			}

			return [{
				datasets: [{
					label: 'Combined',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount + x.remoteCount }))
				}, {
					label: 'Local',
					fill: true,
					backgroundColor: rgba(colors.local),
					borderColor: colors.local,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
				}, {
					label: 'Remote',
					fill: true,
					backgroundColor: rgba(colors.remote),
					borderColor: colors.remote,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
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
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					incoming: this.stats.network.incomingRequests[i]
				});
			}

			return [{
				datasets: [{
					label: 'Incoming',
					fill: true,
					backgroundColor: rgba(colors.localPlus),
					borderColor: colors.localPlus,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.incoming }))
				}]
			}];
		},

		networkTimeChart(): any {
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					time: this.stats.network.incomingRequests[i] != 0 ? (this.stats.network.totalTime[i] / this.stats.network.incomingRequests[i]) : 0,
				});
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
					data: data.map(x => ({ t: x.date, y: x.time }))
				}]
			}];
		},

		networkUsageChart(): any {
			const data = [];

			for (let i = 0; i < limit; i++) {
				data.push({
					date: this.getDate(i),
					incoming: this.stats.network.incomingBytes[i],
					outgoing: this.stats.network.outgoingBytes[i]
				});
			}

			return [{
				datasets: [{
					label: 'Incoming',
					fill: true,
					backgroundColor: rgba(colors.incoming),
					borderColor: colors.incoming,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.incoming }))
				}, {
					label: 'Outgoing',
					fill: true,
					backgroundColor: rgba(colors.outgoing),
					borderColor: colors.outgoing,
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.outgoing }))
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
