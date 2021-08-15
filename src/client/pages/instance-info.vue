<template>
<FormBase>
	<FormGroup v-if="instance">
		<template #label>{{ instance.host }}</template>
		<FormGroup>
			<div class="_formItem">
				<div class="_formPanel fnfelxur">
					<img :src="instance.iconUrl || instance.faviconUrl" alt="" class="icon"/>
				</div>
			</div>
			<FormKeyValueView>
				<template #key>Name</template>
				<template #value><span class="_monospace">{{ instance.name || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormButton v-if="$i.isAdmin || $i.isModerator" @click="info" primary>{{ $ts.settings }}</FormButton>

		<FormTextarea readonly :value="instance.description">
			<span>{{ $ts.description }}</span>
		</FormTextarea>

		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.software }}</template>
				<template #value><span class="_monospace">{{ instance.softwareName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.version }}</template>
				<template #value><span class="_monospace">{{ instance.softwareVersion || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.administrator }}</template>
				<template #value><span class="_monospace">{{ instance.maintainerName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.contact }}</template>
				<template #value><span class="_monospace">{{ instance.maintainerEmail || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestSentAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestStatus }}</template>
				<template #value>{{ instance.latestStatus ? instance.latestStatus : 'N/A' }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestReceivedAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>Open Registrations</template>
				<template #value>{{ instance.openRegistrations ? $ts.yes : $ts.no }}</template>
			</FormKeyValueView>
		</FormGroup>
		<div class="_formItem">
			<div class="_formLabel">{{ $ts.statistics }}</div>
			<div class="_formPanel cmhjzshl">
				<div class="selects">
					<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
						<option value="requests">{{ $ts._instanceCharts.requests }}</option>
						<option value="users">{{ $ts._instanceCharts.users }}</option>
						<option value="users-total">{{ $ts._instanceCharts.usersTotal }}</option>
						<option value="notes">{{ $ts._instanceCharts.notes }}</option>
						<option value="notes-total">{{ $ts._instanceCharts.notesTotal }}</option>
						<option value="ff">{{ $ts._instanceCharts.ff }}</option>
						<option value="ff-total">{{ $ts._instanceCharts.ffTotal }}</option>
						<option value="drive-usage">{{ $ts._instanceCharts.cacheSize }}</option>
						<option value="drive-usage-total">{{ $ts._instanceCharts.cacheSizeTotal }}</option>
						<option value="drive-files">{{ $ts._instanceCharts.files }}</option>
						<option value="drive-files-total">{{ $ts._instanceCharts.filesTotal }}</option>
					</MkSelect>
					<MkSelect v-model="chartSpan" style="margin: 0;">
						<option value="hour">{{ $ts.perHour }}</option>
						<option value="day">{{ $ts.perDay }}</option>
					</MkSelect>
				</div>
				<div class="chart">
					<canvas :ref="setChart"></canvas>
				</div>
			</div>
		</div>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.registeredAt }}</template>
				<template #value><MkTime mode="detail" :time="instance.caughtAt"/></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.updatedAt }}</template>
				<template #value><MkTime mode="detail" :time="instance.infoUpdatedAt"/></template>
			</FormKeyValueView>
		</FormGroup>
		<FormObjectView tall :value="instance">
			<span>Raw</span>
		</FormObjectView>
		<FormGroup>
			<template #label>Well-known resources</template>
			<FormLink :to="`https://${host}/.well-known/host-meta`" external>host-meta</FormLink>
			<FormLink :to="`https://${host}/.well-known/host-meta.json`" external>host-meta.json</FormLink>
			<FormLink :to="`https://${host}/.well-known/nodeinfo`" external>nodeinfo</FormLink>
			<FormLink :to="`https://${host}/robots.txt`" external>robots.txt</FormLink>
			<FormLink :to="`https://${host}/manifest.json`" external>manifest.json</FormLink>
		</FormGroup>
		<FormSuspense :p="dnsPromiseFactory" v-slot="{ result: dns }">
			<FormGroup>
				<template #label>DNS</template>
				<FormKeyValueView v-for="record in dns.a" :key="record">
					<template #key>A</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.aaaa" :key="record">
					<template #key>AAAA</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.cname" :key="record">
					<template #key>CNAME</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.txt">
					<template #key>TXT</template>
					<template #value><span class="_monospace">{{ record[0] }}</span></template>
				</FormKeyValueView>
			</FormGroup>
		</FormSuspense>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import Chart from 'chart.js';
import FormObjectView from '@client/components/form/object-view.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import MkSelect from '@client/components/ui/select.vue';
import * as os from '@client/os';
import number from '@client/filters/number';
import bytes from '@client/filters/bytes';
import * as symbols from '@client/symbols';
import MkInstanceInfo from '@client/pages/instance/instance.vue';

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

export default defineComponent({
	components: {
		FormBase,
		FormTextarea,
		FormObjectView,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		FormSuspense,
		MkSelect,
	},

	props: {
		host: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceInfo,
				icon: 'fas fa-info-circle',
				actions: [{
					text: `https://${this.host}`,
					icon: 'fas fa-external-link-alt',
					handler: () => {
						window.open(`https://${this.host}`, '_blank');
					}
				}],
			},
			instance: null,
			dnsPromiseFactory: () => os.api('federation/dns', {
				host: this.host
			}),
			now: null,
			canvas: null,
			chart: null,
			chartInstance: null,
			chartSrc: 'requests',
			chartSpan: 'hour',
		}
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
	},

	watch: {
		chartSrc() {
			this.renderChart();
		},

		chartSpan() {
			this.renderChart();
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		number,
		bytes,

		async fetch() {
			this.instance = await os.api('federation/show-instance', {
				host: this.host
			});

			this.now = new Date();

			const [perHour, perDay] = await Promise.all([
				os.api('charts/instance', { host: this.instance.host, limit: chartLimit, span: 'hour' }),
				os.api('charts/instance', { host: this.instance.host, limit: chartLimit, span: 'day' }),
			]);

			const chart = {
				perHour: perHour,
				perDay: perDay
			};

			this.chart = chart;

			this.renderChart();
		},

		setChart(el) {
			this.canvas = el;
		},

		renderChart() {
			if (this.chartInstance) {
				this.chartInstance.destroy();
			}

			Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');
			this.chartInstance = new Chart(this.canvas, {
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
							bottom: 16
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

		info() {
			os.popup(MkInstanceInfo, {
				instance: this.instance
			}, {}, 'closed');
		}
	}
});
</script>

<style lang="scss" scoped>
.fnfelxur {
	padding: 16px;

	> .icon {
		display: block;
		margin: auto;
		height: 64px;
		border-radius: 8px;
	}
}

.cmhjzshl {
	> .selects {
		display: flex;
		padding: 16px;
	}
}
</style>
