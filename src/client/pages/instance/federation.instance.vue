<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }" :no-padding="true" :width="520" :height="500">
	<template #header>{{ instance.host }}</template>
	<div class="mk-instance-info">
		<div class="_table">
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $t('software') }}</div>
					<div class="_data">{{ instance.softwareName || '?' }}</div>
				</div>
				<div class="_cell">
					<div class="_label">{{ $t('version') }}</div>
					<div class="_data">{{ instance.softwareVersion || '?' }}</div>
				</div>
			</div>
		</div>
		<div class="_table data">
			<div class="_row">
				<div class="_cell">
					<div class="_label"><fa :icon="faCrosshairs" fixed-width class="icon"/>{{ $t('registeredAt') }}</div>
					<div class="_data">{{ new Date(instance.caughtAt).toLocaleString() }} (<mk-time :time="instance.caughtAt"/>)</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="label"><fa :icon="faCloudDownloadAlt" fixed-width class="icon"/>{{ $t('following') }}</div>
					<button class="_data _textButton" @click="showFollowing()">{{ instance.followingCount | number }}</button>
				</div>
				<div class="_cell">
					<div class="_label"><fa :icon="faCloudUploadAlt" fixed-width class="icon"/>{{ $t('followers') }}</div>
					<button class="_data _textButton" @click="showFollowers()">{{ instance.followersCount | number }}</button>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label"><fa :icon="faUsers" fixed-width class="icon"/>{{ $t('users') }}</div>
					<button class="_data _textButton" @click="showUsers()">{{ instance.usersCount | number }}</button>
				</div>
				<div class="_cell">
					<div class="_label"><fa :icon="faPencilAlt" fixed-width class="icon"/>{{ $t('notes') }}</div>
					<div class="_data">{{ instance.notesCount | number }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label"><fa :icon="faFileImage" fixed-width class="icon"/>{{ $t('files') }}</div>
					<div class="_data">{{ instance.driveFiles | number }}</div>
				</div>
				<div class="_cell">
					<div class="_label"><fa :icon="faDatabase" fixed-width class="icon"/>{{ $t('storageUsage') }}</div>
					<div class="_data">{{ instance.driveUsage | bytes }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label"><fa :icon="faLongArrowAltUp" fixed-width class="icon"/>{{ $t('latestRequestSentAt') }}</div>
					<div class="_data"><mk-time v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></div>
				</div>
				<div class="_cell">
					<div class="_label"><fa :icon="faTrafficLight" fixed-width class="icon"/>{{ $t('latestStatus') }}</div>
					<div class="_data">{{ instance.latestStatus ? instance.latestStatus : 'N/A' }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label"><fa :icon="faLongArrowAltDown" fixed-width class="icon"/>{{ $t('latestRequestReceivedAt') }}</div>
					<div class="_data"><mk-time v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></div>
				</div>
			</div>
		</div>
		<div class="chart">
			<div class="header">
				<span class="label">{{ $t('charts') }}</span>
				<div class="selects">
					<mk-select v-model="chartSrc" style="margin: 0; flex: 1;">
						<option value="requests">{{ $t('_instanceCharts.requests') }}</option>
						<option value="users">{{ $t('_instanceCharts.users') }}</option>
						<option value="users-total">{{ $t('_instanceCharts.usersTotal') }}</option>
						<option value="notes">{{ $t('_instanceCharts.notes') }}</option>
						<option value="notes-total">{{ $t('_instanceCharts.notesTotal') }}</option>
						<option value="ff">{{ $t('_instanceCharts.ff') }}</option>
						<option value="ff-total">{{ $t('_instanceCharts.ffTotal') }}</option>
						<option value="drive-usage">{{ $t('_instanceCharts.cacheSize') }}</option>
						<option value="drive-usage-total">{{ $t('_instanceCharts.cacheSizeTotal') }}</option>
						<option value="drive-files">{{ $t('_instanceCharts.files') }}</option>
						<option value="drive-files-total">{{ $t('_instanceCharts.filesTotal') }}</option>
					</mk-select>
					<mk-select v-model="chartSpan" style="margin: 0;">
						<option value="hour">{{ $t('perHour') }}</option>
						<option value="day">{{ $t('perDay') }}</option>
					</mk-select>
				</div>
			</div>
			<div class="chart">
				<canvas ref="chart"></canvas>
			</div>
		</div>
		<div class="operations">
			<span class="label">{{ $t('operations') }}</span>
			<mk-switch v-model="isSuspended" class="switch">{{ $t('stopActivityDelivery') }}</mk-switch>
			<mk-switch :value="isBlocked" class="switch" @change="changeBlock">{{ $t('blockThisInstance') }}</mk-switch>
			<details>
				<summary>{{ $t('deleteAllFiles') }}</summary>
				<mk-button @click="deleteAllFiles()" style="margin: 0.5em 0 0.5em 0;"><fa :icon="faTrashAlt"/> {{ $t('deleteAllFiles') }}</mk-button>
			</details>
			<details>
				<summary>{{ $t('removeAllFollowing') }}</summary>
				<mk-button @click="removeAllFollowing()" style="margin: 0.5em 0 0.5em 0;"><fa :icon="faMinusCircle"/> {{ $t('removeAllFollowing') }}</mk-button>
				<mk-info warn>{{ $t('removeAllFollowingDescription', { host: instance.host }) }}</mk-info>
			</details>
		</div>
		<details class="metadata">
			<summary class="label">{{ $t('metadata') }}</summary>
			<pre><code>{{ JSON.stringify(instance, null, 2) }}</code></pre>
		</details>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import Chart from 'chart.js';
import { faTimes, faCrosshairs, faCloudDownloadAlt, faCloudUploadAlt, faUsers, faPencilAlt, faFileImage, faDatabase, faTrafficLight, faLongArrowAltUp, faLongArrowAltDown, faMinusCircle, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import XWindow from '../../components/window.vue';
import MkUsersDialog from '../../components/users-dialog.vue';
import MkSelect from '../../components/ui/select.vue';
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkInfo from '../../components/ui/info.vue';

const chartLimit = 90;
const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);
const alpha = hex => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, 0.1)`;
};

export default Vue.extend({
	components: {
		XWindow,
		MkSelect,
		MkButton,
		MkSwitch,
		MkInfo,
	},

	props: {
		instance: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			isSuspended: this.instance.isSuspended,
			now: null,
			chart: null,
			chartInstance: null,
			chartSrc: 'requests',
			chartSpan: 'hour',
			faTimes, faCrosshairs, faCloudDownloadAlt, faCloudUploadAlt, faUsers, faPencilAlt, faFileImage, faDatabase, faTrafficLight, faLongArrowAltUp, faLongArrowAltDown, faMinusCircle, faTrashAlt
		};
	},

	computed: {
		data(): any {
			if (this.chart == null) return null;
			switch (this.chartSrc) {
				case 'requests': return this.requestsChart();
				case 'users': return this.usersChart(false);
				case 'users-total': return this.usersChart(true);
				case 'notes': return this.notesChart(false);
				case 'notes-total': return this.notesChart(true);
				case 'ff': return this.ffChart(false);
				case 'ff-total': return this.ffChart(true);
				case 'drive-usage': return this.driveUsageChart(false);
				case 'drive-usage-total': return this.driveUsageChart(true);
				case 'drive-files': return this.driveFilesChart(false);
				case 'drive-files-total': return this.driveFilesChart(true);
			}
		},

		stats(): any[] {
			const stats =
				this.chartSpan == 'day' ? this.chart.perDay :
				this.chartSpan == 'hour' ? this.chart.perHour :
				null;

			return stats;
		},

		meta() {
			return this.$store.state.instance.meta;
		},

		isBlocked() {
			return this.meta && this.meta.blockedHosts.includes(this.instance.host);
		}
	},

	watch: {
		isSuspended() {
			this.$root.api('admin/federation/update-instance', {
				host: this.instance.host,
				isSuspended: this.isSuspended
			});
		},

		chartSrc() {
			this.renderChart();
		},

		chartSpan() {
			this.renderChart();
		}
	},

	async created() {	
		this.now = new Date();

		const [perHour, perDay] = await Promise.all([
			this.$root.api('charts/instance', { host: this.instance.host, limit: chartLimit, span: 'hour' }),
			this.$root.api('charts/instance', { host: this.instance.host, limit: chartLimit, span: 'day' }),
		]);

		const chart = {
			perHour: perHour,
			perDay: perDay
		};

		this.chart = chart;

		this.renderChart();
	},

	methods: {
		changeBlock(e) {
			this.$root.api('admin/update-meta', {
				blockedHosts: this.isBlocked ? this.meta.blockedHosts.concat([this.instance.host]) : this.meta.blockedHosts.filter(x => x !== this.instance.host)
			});
		},

		setSrc(src) {
			this.chartSrc = src;
		},

		removeAllFollowing() {
			this.$root.api('admin/federation/remove-all-following', {
				host: this.instance.host
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		deleteAllFiles() {
			this.$root.api('admin/federation/delete-all-files', {
				host: this.instance.host
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		renderChart() {
			if (this.chartInstance) {
				this.chartInstance.destroy();
			}

			Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');
			this.chartInstance = new Chart(this.$refs.chart, {
				type: 'line',
				data: {
					labels: new Array(chartLimit).fill(0).map((_, i) => this.getDate(i).toLocaleString()).slice().reverse(),
					datasets: this.data.series.map(x => ({
						label: x.name,
						data: x.data.slice().reverse(),
						pointRadius: 0,
						lineTension: 0,
						borderWidth: 2,
						borderColor: x.color,
						backgroundColor: alpha(x.color),
					}))
				},
				options: {
					aspectRatio: 2.5,
					layout: {
						padding: {
							left: 16,
							right: 16,
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
							gridLines: {
								display: false
							},
							ticks: {
								display: false
							}
						}],
						yAxes: [{
							position: 'right',
							ticks: {
								display: false
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
			return arr;
		},

		requestsChart(): any {
			return {
				series: [{
					name: 'In',
					color: '#008FFB',
					data: this.format(this.stats.requests.received)
				}, {
					name: 'Out (succ)',
					color: '#00E396',
					data: this.format(this.stats.requests.succeeded)
				}, {
					name: 'Out (fail)',
					color: '#FEB019',
					data: this.format(this.stats.requests.failed)
				}]
			};
		},

		usersChart(total: boolean): any {
			return {
				series: [{
					name: 'Users',
					color: '#008FFB',
					data: this.format(total
						? this.stats.users.total
						: sum(this.stats.users.inc, negate(this.stats.users.dec))
					)
				}]
			};
		},

		notesChart(total: boolean): any {
			return {
				series: [{
					name: 'Notes',
					color: '#008FFB',
					data: this.format(total
						? this.stats.notes.total
						: sum(this.stats.notes.inc, negate(this.stats.notes.dec))
					)
				}]
			};
		},

		ffChart(total: boolean): any {
			return {
				series: [{
					name: 'Following',
					color: '#008FFB',
					data: this.format(total
						? this.stats.following.total
						: sum(this.stats.following.inc, negate(this.stats.following.dec))
					)
				}, {
					name: 'Followers',
					color: '#00E396',
					data: this.format(total
						? this.stats.followers.total
						: sum(this.stats.followers.inc, negate(this.stats.followers.dec))
					)
				}]
			};
		},

		driveUsageChart(total: boolean): any {
			return {
				bytes: true,
				series: [{
					name: 'Drive usage',
					color: '#008FFB',
					data: this.format(total
						? this.stats.drive.totalUsage
						: sum(this.stats.drive.incUsage, negate(this.stats.drive.decUsage))
					)
				}]
			};
		},

		driveFilesChart(total: boolean): any {
			return {
				series: [{
					name: 'Drive files',
					color: '#008FFB',
					data: this.format(total
						? this.stats.drive.totalFiles
						: sum(this.stats.drive.incFiles, negate(this.stats.drive.decFiles))
					)
				}]
			};
		},

		showFollowing() {
			this.$root.new(MkUsersDialog, {
				title: this.$t('instanceFollowing'),
				pagination: {
					endpoint: 'federation/following',
					limit: 10,
					params: {
						host: this.instance.host
					}
				},
				extract: item => item.follower
			});
		},

		showFollowers() {
			this.$root.new(MkUsersDialog, {
				title: this.$t('instanceFollowers'),
				pagination: {
					endpoint: 'federation/followers',
					limit: 10,
					params: {
						host: this.instance.host
					}
				},
				extract: item => item.followee
			});
		},

		showUsers() {
			this.$root.new(MkUsersDialog, {
				title: this.$t('instanceUsers'),
				pagination: {
					endpoint: 'federation/users',
					limit: 10,
					params: {
						host: this.instance.host
					}
				}
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-info {
	overflow: auto;

	> ._table {
		padding: 0 32px;

		@media (max-width: 500px) {
			padding: 0 16px;
		}
	}

	> .data {
		margin-top: 16px;
		padding-top: 16px;
		border-top: solid 1px var(--divider);

		@media (max-width: 500px) {
			margin-top: 8px;
			padding-top: 8px;
		}
	}

	> .chart {
		margin-top: 16px;
		padding-top: 16px;
		border-top: solid 1px var(--divider);

		@media (max-width: 500px) {
			margin-top: 8px;
			padding-top: 8px;
		}

		> .header {
			padding: 0 32px;

			@media (max-width: 500px) {
				padding: 0 16px;
			}

			> .label {
				font-size: 80%;
				opacity: 0.7;
			}

			> .selects {
				display: flex;
			}
		}

		> .chart {
			padding: 0 16px;

			@media (max-width: 500px) {
				padding: 0;
			}
		}
	}

	> .operations {
		padding: 16px 32px 16px 32px;
		margin-top: 8px;
		border-top: solid 1px var(--divider);

		@media (max-width: 500px) {
			padding: 8px 16px 8px 16px;
			margin-top: 0;
		}

		> .label {
			font-size: 80%;
			opacity: 0.7;
		}

		> .switch {
			margin: 16px 0;
		}
	}

	> .metadata {
		padding: 16px 32px 16px 32px;
		border-top: solid 1px var(--divider);

		@media (max-width: 500px) {
			padding: 8px 16px 8px 16px;
		}

		> .label {
			font-size: 80%;
			opacity: 0.7;
		}

		> pre > code {
			display: block;
			max-height: 200px;
			overflow: auto;
		}
	}
}
</style>
