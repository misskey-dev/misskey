<template>
<div class="zbcjwnqg" v-size="{ max: [550, 1200] }">
	<div class="stats" v-if="info">
		<div class="_panel">
			<div>
				<b><Fa :icon="faUser"/>{{ $t('users') }}</b>
				<small>{{ $t('local') }}</small>
			</div>
			<div>
				<dl class="total">
					<dt>{{ $t('total') }}</dt>
					<dd>{{ number(info.originalUsersCount) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: usersLocalDoD > 0 }">
					<dt>{{ $t('dayOverDayChanges') }}</dt>
					<dd>{{ number(usersLocalDoD) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: usersLocalWoW > 0 }">
					<dt>{{ $t('weekOverWeekChanges') }}</dt>
					<dd>{{ number(usersLocalWoW) }}</dd>
				</dl>
			</div>
		</div>
		<div class="_panel">
			<div>
				<b><Fa :icon="faUser"/>{{ $t('users') }}</b>
				<small>{{ $t('remote') }}</small>
			</div>
			<div>
				<dl class="total">
					<dt>{{ $t('total') }}</dt>
					<dd>{{ number((info.usersCount - info.originalUsersCount)) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: usersRemoteDoD > 0 }">
					<dt>{{ $t('dayOverDayChanges') }}</dt>
					<dd>{{ number(usersRemoteDoD) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: usersRemoteWoW > 0 }">
					<dt>{{ $t('weekOverWeekChanges') }}</dt>
					<dd>{{ number(usersRemoteWoW) }}</dd>
				</dl>
			</div>
		</div>
		<div class="_panel">
			<div>
				<b><Fa :icon="faPencilAlt"/>{{ $t('notes') }}</b>
				<small>{{ $t('local') }}</small>
			</div>
			<div>
				<dl class="total">
					<dt>{{ $t('total') }}</dt>
					<dd>{{ number(info.originalNotesCount) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: notesLocalDoD > 0 }">
					<dt>{{ $t('dayOverDayChanges') }}</dt>
					<dd>{{ number(notesLocalDoD) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: notesLocalWoW > 0 }">
					<dt>{{ $t('weekOverWeekChanges') }}</dt>
					<dd>{{ number(notesLocalWoW) }}</dd>
				</dl>
			</div>
		</div>
		<div class="_panel">
			<div>
				<b><Fa :icon="faPencilAlt"/>{{ $t('notes') }}</b>
				<small>{{ $t('remote') }}</small>
			</div>
			<div>
				<dl class="total">
					<dt>{{ $t('total') }}</dt>
					<dd>{{ number((info.notesCount - info.originalNotesCount)) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: notesRemoteDoD > 0 }">
					<dt>{{ $t('dayOverDayChanges') }}</dt>
					<dd>{{ number(notesRemoteDoD) }}</dd>
				</dl>
				<dl class="diff" :class="{ inc: notesRemoteWoW > 0 }">
					<dt>{{ $t('weekOverWeekChanges') }}</dt>
					<dd>{{ number(notesRemoteWoW) }}</dd>
				</dl>
			</div>
		</div>
	</div>

	<section class="_section">
		<div class="_title" style="position: relative;"><Fa :icon="faChartBar"/> {{ $t('statistics') }}<button @click="fetchChart" class="_button" style="position: absolute; right: 0; bottom: 0; top: 0; padding: inherit;"><Fa :icon="faSync"/></button></div>
		<div class="_content" style="margin-top: -8px;">
			<div class="selects" style="display: flex;">
				<MkSelect v-model:value="chartSrc" style="margin: 0; flex: 1;">
					<optgroup :label="$t('federation')">
						<option value="federation-instances">{{ $t('_charts.federationInstancesIncDec') }}</option>
						<option value="federation-instances-total">{{ $t('_charts.federationInstancesTotal') }}</option>
					</optgroup>
					<optgroup :label="$t('users')">
						<option value="users">{{ $t('_charts.usersIncDec') }}</option>
						<option value="users-total">{{ $t('_charts.usersTotal') }}</option>
						<option value="active-users">{{ $t('_charts.activeUsers') }}</option>
					</optgroup>
					<optgroup :label="$t('notes')">
						<option value="notes">{{ $t('_charts.notesIncDec') }}</option>
						<option value="local-notes">{{ $t('_charts.localNotesIncDec') }}</option>
						<option value="remote-notes">{{ $t('_charts.remoteNotesIncDec') }}</option>
						<option value="notes-total">{{ $t('_charts.notesTotal') }}</option>
					</optgroup>
					<optgroup :label="$t('drive')">
						<option value="drive-files">{{ $t('_charts.filesIncDec') }}</option>
						<option value="drive-files-total">{{ $t('_charts.filesTotal') }}</option>
						<option value="drive">{{ $t('_charts.storageUsageIncDec') }}</option>
						<option value="drive-total">{{ $t('_charts.storageUsageTotal') }}</option>
					</optgroup>
				</MkSelect>
				<MkSelect v-model:value="chartSpan" style="margin: 0;">
					<option value="hour">{{ $t('perHour') }}</option>
					<option value="day">{{ $t('perDay') }}</option>
				</MkSelect>
			</div>
			<canvas ref="chart"></canvas>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChartBar, faUser, faPencilAlt, faSync } from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js';
import MkSelect from './ui/select.vue';
import number from '@/filters/number';

const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);
const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};
import * as os from '@/os';

export default defineComponent({
	components: {
		MkSelect
	},

	props: {
		chartLimit: {
			type: Number,
			required: false,
			default: 90
		},
		detailed: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	data() {
		return {
			info: null,
			notesLocalWoW: 0,
			notesLocalDoD: 0,
			notesRemoteWoW: 0,
			notesRemoteDoD: 0,
			usersLocalWoW: 0,
			usersLocalDoD: 0,
			usersRemoteWoW: 0,
			usersRemoteDoD: 0,
			now: null,
			chart: null,
			chartInstance: null,
			chartSrc: 'notes',
			chartSpan: 'hour',
			faChartBar, faUser, faPencilAlt, faSync
		}
	},

	computed: {
		data(): any {
			if (this.chart == null) return null;
			switch (this.chartSrc) {
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
			}
		},

		stats(): any[] {
			const stats =
				this.chartSpan == 'day' ? this.chart.perDay :
				this.chartSpan == 'hour' ? this.chart.perHour :
				null;

			return stats;
		}
	},

	watch: {
		chartSrc() {
			this.renderChart();
		},

		chartSpan() {
			this.renderChart();
		}
	},

	async created() {
		this.info = await os.api('stats');

		this.now = new Date();

		this.fetchChart();
	},

	methods: {
		async fetchChart() {
			const [perHour, perDay] = await Promise.all([Promise.all([
				os.api('charts/federation', { limit: this.chartLimit, span: 'hour' }),
				os.api('charts/users', { limit: this.chartLimit, span: 'hour' }),
				os.api('charts/active-users', { limit: this.chartLimit, span: 'hour' }),
				os.api('charts/notes', { limit: this.chartLimit, span: 'hour' }),
				os.api('charts/drive', { limit: this.chartLimit, span: 'hour' }),
			]), Promise.all([
				os.api('charts/federation', { limit: this.chartLimit, span: 'day' }),
				os.api('charts/users', { limit: this.chartLimit, span: 'day' }),
				os.api('charts/active-users', { limit: this.chartLimit, span: 'day' }),
				os.api('charts/notes', { limit: this.chartLimit, span: 'day' }),
				os.api('charts/drive', { limit: this.chartLimit, span: 'day' }),
			])]);

			const chart = {
				perHour: {
					federation: perHour[0],
					users: perHour[1],
					activeUsers: perHour[2],
					notes: perHour[3],
					drive: perHour[4],
				},
				perDay: {
					federation: perDay[0],
					users: perDay[1],
					activeUsers: perDay[2],
					notes: perDay[3],
					drive: perDay[4],
				}
			};

			this.notesLocalWoW = this.info.originalNotesCount - chart.perDay.notes.local.total[7];
			this.notesLocalDoD = this.info.originalNotesCount - chart.perDay.notes.local.total[1];
			this.notesRemoteWoW = (this.info.notesCount - this.info.originalNotesCount) - chart.perDay.notes.remote.total[7];
			this.notesRemoteDoD = (this.info.notesCount - this.info.originalNotesCount) - chart.perDay.notes.remote.total[1];
			this.usersLocalWoW = this.info.originalUsersCount - chart.perDay.users.local.total[7];
			this.usersLocalDoD = this.info.originalUsersCount - chart.perDay.users.local.total[1];
			this.usersRemoteWoW = (this.info.usersCount - this.info.originalUsersCount) - chart.perDay.users.remote.total[7];
			this.usersRemoteDoD = (this.info.usersCount - this.info.originalUsersCount) - chart.perDay.users.remote.total[1];

			this.chart = chart;

			this.renderChart();
		},

		renderChart() {
			if (this.chartInstance) {
				this.chartInstance.destroy();
			}

			// TODO: var(--panel)の色が暗いか明るいかで判定する
			const gridColor = this.$store.state.device.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

			Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');
			this.chartInstance = new Chart(this.$refs.chart, {
				type: 'line',
				data: {
					labels: new Array(this.chartLimit).fill(0).map((_, i) => this.getDate(i).toLocaleString()).slice().reverse(),
					datasets: this.data.series.map(x => ({
						label: x.name,
						data: x.data.slice().reverse(),
						pointRadius: 0,
						lineTension: 0,
						borderWidth: 2,
						borderColor: x.color,
						borderDash: x.borderDash || [],
						backgroundColor: alpha(x.color, 0.1),
						fill: x.fill == null ? true : x.fill,
						hidden: !!x.hidden
					}))
				},
				options: {
					aspectRatio: 2.5,
					layout: {
						padding: {
							left: 0,
							right: 0,
							top: 16,
							bottom: 0
						}
					},
					legend: {
						position: 'bottom',
						labels: {
							boxWidth: 16,
						}
					},
					scales: {
						xAxes: [{
							type: 'time',
							time: {
								stepSize: 1,
								unit: this.chartSpan == 'day' ? 'month' : 'day',
							},
							gridLines: {
								display: this.detailed,
								color: gridColor,
								zeroLineColor: gridColor,
							},
							ticks: {
								display: this.detailed
							}
						}],
						yAxes: [{
							position: 'left',
							gridLines: {
								color: gridColor,
								zeroLineColor: gridColor,
							},
							ticks: {
								display: this.detailed
							}
						}]
					},
					tooltips: {
						intersect: false,
						mode: 'index',
					}
				}
			});
		},

		getDate(ago: number) {
			const y = this.now.getFullYear();
			const m = this.now.getMonth();
			const d = this.now.getDate();
			const h = this.now.getHours();

			return this.chartSpan == 'day' ? new Date(y, m, d - ago) : new Date(y, m, d, h - ago);
		},

		format(arr) {
			const now = Date.now();
			return arr.map((v, i) => ({
				x: new Date(now - ((this.chartSpan == 'day' ? 86400000 :3600000 ) * i)),
				y: v
			}));
		},

		federationInstancesChart(total: boolean): any {
			return {
				series: [{
					name: 'Instances',
					color: '#008FFB',
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
					color: '#008FFB',
					borderDash: [5, 5],
					fill: false,
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.inc, negate(this.stats.notes.local.dec), this.stats.notes.remote.inc, negate(this.stats.notes.remote.dec))
						: sum(this.stats.notes[type].inc, negate(this.stats.notes[type].dec))
					)
				}, {
					name: 'Renotes',
					type: 'area',
					color: '#00E396',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.renote, this.stats.notes.remote.diffs.renote)
						: this.stats.notes[type].diffs.renote
					)
				}, {
					name: 'Replies',
					type: 'area',
					color: '#FEB019',
					data: this.format(type == 'combined'
						? sum(this.stats.notes.local.diffs.reply, this.stats.notes.remote.diffs.reply)
						: this.stats.notes[type].diffs.reply
					)
				}, {
					name: 'Normal',
					type: 'area',
					color: '#FF4560',
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
					color: '#008FFB',
					data: this.format(sum(this.stats.notes.local.total, this.stats.notes.remote.total))
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.notes.local.total)
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.notes.remote.total)
				}]
			};
		},

		usersChart(total: boolean): any {
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: this.format(total
						? sum(this.stats.users.local.total, this.stats.users.remote.total)
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec), this.stats.users.remote.inc, negate(this.stats.users.remote.dec))
					)
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(total
						? this.stats.users.local.total
						: sum(this.stats.users.local.inc, negate(this.stats.users.local.dec))
					)
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
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
					color: '#008FFB',
					data: this.format(sum(this.stats.activeUsers.local.count, this.stats.activeUsers.remote.count))
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.activeUsers.local.count)
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
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
					color: '#09d8e2',
					borderDash: [5, 5],
					fill: false,
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
					color: '#008FFB',
					data: this.format(this.stats.drive.local.incSize)
				}, {
					name: 'Local -',
					type: 'area',
					color: '#FF4560',
					data: this.format(negate(this.stats.drive.local.decSize))
				}, {
					name: 'Remote +',
					type: 'area',
					color: '#00E396',
					data: this.format(this.stats.drive.remote.incSize)
				}, {
					name: 'Remote -',
					type: 'area',
					color: '#FEB019',
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
					color: '#008FFB',
					data: this.format(sum(this.stats.drive.local.totalSize, this.stats.drive.remote.totalSize))
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.drive.local.totalSize)
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.drive.remote.totalSize)
				}]
			};
		},

		driveFilesChart(): any {
			return {
				series: [{
					name: 'All',
					type: 'line',
					color: '#09d8e2',
					borderDash: [5, 5],
					fill: false,
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
					color: '#008FFB',
					data: this.format(this.stats.drive.local.incCount)
				}, {
					name: 'Local -',
					type: 'area',
					color: '#FF4560',
					data: this.format(negate(this.stats.drive.local.decCount))
				}, {
					name: 'Remote +',
					type: 'area',
					color: '#00E396',
					data: this.format(this.stats.drive.remote.incCount)
				}, {
					name: 'Remote -',
					type: 'area',
					color: '#FEB019',
					data: this.format(negate(this.stats.drive.remote.decCount))
				}]
			};
		},

		driveFilesTotalChart(): any {
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: this.format(sum(this.stats.drive.local.totalCount, this.stats.drive.remote.totalCount))
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.drive.local.totalCount)
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: this.format(this.stats.drive.remote.totalCount)
				}]
			};
		},

		number
	}
});
</script>

<style lang="scss" scoped>
.zbcjwnqg {
	&.max-width_1200px {
		> .stats {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
		}
	}

	&.max-width_550px {
		> .stats {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr 1fr 1fr;
		}
	}

	> .stats {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		grid-template-rows: 1fr;
		gap: var(--margin);
		margin-bottom: var(--margin);
		font-size: 90%;

		> div {
			display: flex;
			box-sizing: border-box;
			padding: 16px 20px;

			> div {
				width: 50%;

				&:first-child {
					> b {
						display: block;

						> [data-icon] {
							width: 16px;
							margin-right: 8px;
						}
					}

					> small {
						margin-left: 16px + 8px;
						opacity: 0.7;
					}
				}

				&:last-child {
					> dl {
						display: flex;
						margin: 0;
						line-height: 1.5em;

						> dt,
						> dd {
							width: 50%;
							margin: 0;
						}

						> dd {
							text-overflow: ellipsis;
							overflow: hidden;
							white-space: nowrap;
						}

						&.total {
							> dt,
							> dd {
								font-weight: bold;
							}
						}

						&.diff.inc {
							> dd {
								color: #82c11c;

								&:before {
									content: "+";
								}
							}
						}
					}
				}
			}
		}
	}
}
</style>
