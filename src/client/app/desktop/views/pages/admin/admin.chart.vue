<template>
<div class="card gkgckalzgidaygcxnugepioremxvxvpt">
	<header>
		<b>%i18n:@title%:</b>
		<select v-model="chartType">
			<optgroup label="%i18n:@users%">
				<option value="local-users">%i18n:@local-users%</option>
				<option value="remote-users">%i18n:@remote-users%</option>
				<option value="local-users-total">%i18n:@local-users-total%</option>
				<option value="remote-users-total">%i18n:@remote-users-total%</option>
			</optgroup>
			<optgroup label="%i18n:@notes%">
				<option value="local-notes">%i18n:@local-notes%</option>
				<option value="remote-notes">%i18n:@remote-notes%</option>
				<option value="local-notes-total">%i18n:@local-notes-total%</option>
				<option value="remote-notes-total">%i18n:@remote-notes-total%</option>
			</optgroup>
			<optgroup label="%i18n:@drive%">
				<option value="local-drive-files">%i18n:@local-drive-files%</option>
				<option value="remote-drive-files">%i18n:@remote-drive-files%</option>
				<option value="local-drive-files-total">%i18n:@local-drive-files-total%</option>
				<option value="remote-drive-files-total">%i18n:@remote-drive-files-total%</option>
				<option value="local-drive">%i18n:@local-drive%</option>
				<option value="remote-drive">%i18n:@remote-drive%</option>
				<option value="local-drive-total">%i18n:@local-drive-total%</option>
				<option value="remote-drive-total">%i18n:@remote-drive-total%</option>
			</optgroup>
		</select>
		<div>
			<a @click="span = 'day'">%i18n:@per-day%</a> | <a @click="span = 'hour'">%i18n:@per-hour%</a>
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
	props: {
		chart: {
			required: true
		}
	},
	data() {
		return {
			chartType: 'local-notes',
			span: 'hour'
		};
	},
	computed: {
		data(): any {
			if (this.chart == null) return null;
			switch (this.chartType) {
				case 'local-users': return this.usersChart(true, false);
				case 'remote-users': return this.usersChart(false, false);
				case 'local-users-total': return this.usersChart(true, true);
				case 'remote-users-total': return this.usersChart(false, true);
				case 'local-notes': return this.notesChart(true);
				case 'remote-notes': return this.notesChart(false);
				case 'local-notes-total': return this.notesTotalChart(true);
				case 'remote-notes-total': return this.notesTotalChart(false);
				case 'local-drive': return this.driveChart(true, false);
				case 'remote-drive': return this.driveChart(false, false);
				case 'local-drive-total': return this.driveChart(true, true);
				case 'remote-drive-total': return this.driveChart(false, true);
				case 'local-drive-files': return this.driveFilesChart(true, false);
				case 'remote-drive-files': return this.driveFilesChart(false, false);
				case 'local-drive-files-total': return this.driveFilesChart(true, true);
				case 'remote-drive-files-total': return this.driveFilesChart(false, true);
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
	methods: {
		notesChart(local: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				normal: local ? x.notes.local.diffs.normal : x.notes.remote.diffs.normal,
				reply: local ? x.notes.local.diffs.reply : x.notes.remote.diffs.reply,
				renote: local ? x.notes.local.diffs.renote : x.notes.remote.diffs.renote,
				all: local ? x.notes.local.diff : x.notes.remote.diff
			}));

			return [{
				datasets: [{
					label: 'All',
					fill: false,
					borderColor: '#555',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.all }))
				}, {
					label: 'Normal',
					fill: false,
					borderColor: '#41ddde',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.normal }))
				}, {
					label: 'Replies',
					fill: false,
					borderColor: '#f7796c',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.reply }))
				}, {
					label: 'Renotes',
					fill: false,
					borderColor: '#a1de41',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.renote }))
				}]
			}];
		},

		notesTotalChart(local: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				count: local ? x.notes.local.total : x.notes.remote.total,
			}));

			return [{
				datasets: [{
					label: local ? 'Local Notes' : 'Remote Notes',
					fill: true,
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.count }))
				}]
			}];
		},

		usersChart(local: boolean, total: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				count: local ?
					total ? x.users.local.total : x.users.local.diff :
					total ? x.users.remote.total : x.users.remote.diff
			}));

			return [{
				datasets: [{
					label: local ? 'Local Users' : 'Remote Users',
					fill: true,
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.count }))
				}]
			}];
		},

		driveChart(local: boolean, total: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				size: local ?
					total ? x.drive.local.totalSize : x.drive.local.diffSize :
					total ? x.drive.remote.totalSize : x.drive.remote.diffSize
			}));

			return [{
				datasets: [{
					label: local ? 'Local Drive Usage' : 'Remote Drive Usage',
					fill: true,
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.size }))
				}]
			}, {
				scales: {
					yAxes: [{
						ticks: {
							callback: (value) => {
								return Vue.filter('bytes')(value);
							}
						}
					}]
				}
			}];
		},

		driveFilesChart(local: boolean, total: boolean): any {
			const data = this.stats.slice().reverse().map(x => ({
				date: new Date(x.date),
				count: local ?
					total ? x.drive.local.totalCount : x.drive.local.diffCount :
					total ? x.drive.remote.totalCount : x.drive.remote.diffCount
			}));

			return [{
				datasets: [{
					label: local ? 'Local Drive Files' : 'Remote Drive Files',
					fill: false,
					borderColor: '#f6584f',
					borderWidth: 2,
					pointBackgroundColor: '#fff',
					lineTension: 0,
					data: data.map(x => ({ t: x.date, y: x.count }))
				}]
			}];
		},
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.gkgckalzgidaygcxnugepioremxvxvpt
	> header
		display flex

		> b
			margin-right 8px

		> *:last-child
			margin-left auto

	> div
		> *
			display block
			height 300px

</style>
