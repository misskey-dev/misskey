<template>
<div class="card gkgckalzgidaygcxnugepioremxvxvpt">
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
import XChart from './admin.chart.chart.ts';

export default Vue.extend({
	components: {
		XChart
	},
	data() {
		return {
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
				case 'drive': return this.driveChart(false);
				case 'drive-total': return this.driveChart(true);
				case 'drive-files': return this.driveFilesChart(false);
				case 'drive-files-total': return this.driveFilesChart(true);
			}
		},
		stats(): any[] {
			return (
				this.span == 'day' ? this.chart.perDay :
				this.span == 'hour' ? this.chart.perHour :
				null
			);
		}
	},
	created() {
		(this as any).api('chart').then(chart => {
			this.chart = chart;
		});
	},
	methods: {
		notesChart(type: string): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				normal: type == 'local' ? x.notes.local.diffs.normal : type == 'remote' ? x.notes.remote.diffs.normal : x.notes.local.diffs.normal + x.notes.remote.diffs.normal,
				reply: type == 'local' ? x.notes.local.diffs.reply : type == 'remote' ? x.notes.remote.diffs.reply : x.notes.local.diffs.reply + x.notes.remote.diffs.reply,
				renote: type == 'local' ? x.notes.local.diffs.renote : type == 'remote' ? x.notes.remote.diffs.renote : x.notes.local.diffs.renote + x.notes.remote.diffs.renote,
				all: type == 'local' ? x.notes.local.diff : type == 'remote' ? x.notes.remote.diff : x.notes.local.diff + x.notes.remote.diff
			}));

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
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				localCount: x.notes.local.total,
				remoteCount: x.notes.remote.total
			}));

			return [{
				datasets: [{
					label: 'Notes',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount + x.localCount }))
				}, {
					label: 'Remote Notes',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
				}, {
					label: 'Local Notes',
					fill: true,
					backgroundColor: 'rgba(246, 88, 79, 0.1)',
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
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
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				localCount: total ? x.users.local.total : x.users.local.diff,
				remoteCount: total ? x.users.remote.total : x.users.remote.diff
			}));

			return [{
				datasets: [{
					label: 'Users',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount + x.localCount }))
				}, {
					label: 'Remote Users',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
				}, {
					label: 'Local Users',
					fill: true,
					backgroundColor: 'rgba(246, 88, 79, 0.1)',
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
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

		driveChart(total: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				localSize: total ? x.drive.local.totalSize : x.drive.local.diffSize,
				remoteSize: total ? x.drive.remote.totalSize : x.drive.remote.diffSize
			}));

			return [{
				datasets: [{
					label: 'Drive Usage',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteSize + x.localSize }))
				}, {
					label: 'Remote Drive Usage',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteSize }))
				}, {
					label: 'Local Drive Usage',
					fill: true,
					backgroundColor: 'rgba(246, 88, 79, 0.1)',
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localSize }))
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: value => {
								return Vue.filter('bytes')(value);
							}
						}
					}]
				},
				tooltips: {
					callbacks: {
						label: (tooltipItem, data) => {
							const label = data.datasets[tooltipItem.datasetIndex].label || '';
							return `${label}: ${Vue.filter('bytes')(tooltipItem.yLabel)}`;
						}
					}
				}
			}];
		},

		driveFilesChart(total: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				localCount: total ? x.drive.local.totalCount : x.drive.local.diffCount,
				remoteCount: total ? x.drive.remote.totalCount : x.drive.remote.diffCount
			}));

			return [{
				datasets: [{
					label: 'Drive Files',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					borderDash: [4, 4],
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount + x.localCount }))
				}, {
					label: 'Remote Drive Files',
					fill: true,
					backgroundColor: 'rgba(65, 221, 222, 0.1)',
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.remoteCount }))
				}, {
					label: 'Local Drive Files',
					fill: true,
					backgroundColor: 'rgba(246, 88, 79, 0.1)',
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.localCount }))
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
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.gkgckalzgidaygcxnugepioremxvxvpt
	*
		user-select none

	> header
		display flex

		> b
			margin-right 8px

		> *:last-child
			margin-left auto

			*
				&:not(.active)
					color $theme-color
					cursor pointer

	> div
		> *
			display block
			height 300px

</style>
