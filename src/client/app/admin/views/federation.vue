<template>
<div>
	<ui-card>
		<div slot="title"><fa :icon="faTerminal"/> {{ $t('federation') }}</div>
		<section class="fit-top">
			<ui-input class="target" v-model="target" type="text" @enter="showInstance">
				<span>{{ $t('host') }}</span>
			</ui-input>
			<ui-button @click="showInstance"><fa :icon="faSearch"/> {{ $t('lookup') }}</ui-button>

			<div class="instance" v-if="instance">
				<ui-input :value="instance.host" type="text" readonly>
					<span>{{ $t('host') }}</span>
				</ui-input>
				<ui-horizon-group inputs>
					<ui-input :value="instance.notesCount | number" type="text" readonly>
						<span>{{ $t('notes') }}</span>
					</ui-input>
					<ui-input :value="instance.usersCount | number" type="text" readonly>
						<span>{{ $t('users') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-horizon-group inputs>
					<ui-input :value="instance.followingCount | number" type="text" readonly>
						<span>{{ $t('following') }}</span>
					</ui-input>
					<ui-input :value="instance.followersCount | number" type="text" readonly>
						<span>{{ $t('followers') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-horizon-group inputs>
					<ui-input :value="instance.latestRequestSentAt" type="text" readonly>
						<span>{{ $t('latest-request-sent-at') }}</span>
					</ui-input>
					<ui-input :value="instance.latestStatus" type="text" readonly>
						<span>{{ $t('status') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-input :value="instance.latestRequestReceivedAt" type="text" readonly>
					<span>{{ $t('latest-request-received-at') }}</span>
				</ui-input>
				<ui-switch v-model="instance.isBlocked" @change="updateInstance()">{{ $t('block') }}</ui-switch>
				<details>
					<summary>{{ $t('charts') }}</summary>
					<ui-horizon-group inputs>
						<ui-select v-model="chartSrc">
							<option value="requests">{{ $t('chart-srcs.requests') }}</option>
						</ui-select>
						<ui-select v-model="chartSpan">
							<option value="hour">{{ $t('chart-spans.hour') }}</option>
							<option value="day">{{ $t('chart-spans.day') }}</option>
						</ui-select>
					</ui-horizon-group>
					<div ref="chart"></div>
				</details>
				<details>
					<summary>{{ $t('remove-all-following') }}</summary>
					<ui-button @click="removeAllFollowing()" style="margin-top: 16px;"><fa :icon="faMinusCircle"/> {{ $t('remove-all-following') }}</ui-button>
					<ui-info warn>{{ $t('remove-all-following-info', { host: instance.host }) }}</ui-info>
				</details>
			</div>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">{{ $t('instances') }}</div>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-select v-model="sort">
					<span slot="label">{{ $t('sort') }}</span>
					<option value="-caughtAt">{{ $t('sorts.caughtAtAsc') }}</option>
					<option value="+caughtAt">{{ $t('sorts.caughtAtDesc') }}</option>
					<option value="-notes">{{ $t('sorts.notesAsc') }}</option>
					<option value="+notes">{{ $t('sorts.notesDesc') }}</option>
					<option value="-users">{{ $t('sorts.usersAsc') }}</option>
					<option value="+users">{{ $t('sorts.usersDesc') }}</option>
					<option value="-following">{{ $t('sorts.followingAsc') }}</option>
					<option value="+following">{{ $t('sorts.followingDesc') }}</option>
					<option value="-followers">{{ $t('sorts.followersAsc') }}</option>
					<option value="+followers">{{ $t('sorts.followersDesc') }}</option>
				</ui-select>
				<ui-select v-model="state">
					<span slot="label">{{ $t('state') }}</span>
					<option value="all">{{ $t('states.all') }}</option>
					<option value="blocked">{{ $t('states.blocked') }}</option>
				</ui-select>
			</ui-horizon-group>

			<div class="instances">
				<header>
					<span>{{ $t('host') }}</span>
					<span>{{ $t('notes') }}</span>
					<span>{{ $t('users') }}</span>
					<span>{{ $t('following') }}</span>
					<span>{{ $t('followers') }}</span>
					<span>{{ $t('status') }}</span>
				</header>
				<div v-for="instance in instances">
					<span>{{ instance.host }}</span>
					<span>{{ instance.notesCount | number }}</span>
					<span>{{ instance.usersCount | number }}</span>
					<span>{{ instance.followingCount | number }}</span>
					<span>{{ instance.followersCount | number }}</span>
					<span>{{ instance.latestStatus }}</span>
				</div>
			</div>

			<ui-info v-if="instances.length == limit">{{ $t('result-is-truncated', { n: limit }) }}</ui-info>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faGlobe, faTerminal, faSearch, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import ApexCharts from 'apexcharts';
import * as tinycolor from 'tinycolor2';

const chartLimit = 90;
const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);

export default Vue.extend({
	i18n: i18n('admin/views/federation.vue'),

	data() {
		return {
			instance: null,
			target: null,
			sort: '+caughtAt',
			state: 'all',
			limit: 50,
			instances: [],
			chart: null,
			chartSrc: 'requests',
			chartSpan: 'hour',
			chartInstance: null,
			faGlobe, faTerminal, faSearch, faMinusCircle
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
				case 'following': return this.followingChart(false);
				case 'following-total': return this.followingChart(true);
				case 'followers': return this.followersChart(false);
				case 'followers-total': return this.followersChart(true);
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
		sort() {
			this.fetchInstances();
		},

		state() {
			this.fetchInstances();
		},

		async instance() {
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

		chartSrc() {
			this.renderChart();
		},

		chartSpan() {
			this.renderChart();
		}
	},

	mounted() {
		this.fetchInstances();
	},

	beforeDestroy() {
		this.chartInstance.destroy();
	},

	methods: {
		showInstance() {
			this.$root.api('federation/show-instance', {
				host: this.target
			}).then(instance => {
				if (instance == null) {
					this.$root.dialog({
						type: 'error',
						text: this.$t('instance-not-registered')
					});
				} else {
					this.instance = instance;
					this.target = '';
				}
			});
		},

		fetchInstances() {
			this.instances = [];
			this.$root.api('federation/instances', {
				state: this.state,
				sort: this.sort,
				limit: this.limit
			}).then(instances => {
				this.instances = instances;
			});
		},

		removeAllFollowing() {
			this.$root.api('admin/federation/remove-all-following', {
				host: this.instance.host
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			});
		},

		updateInstance() {
			this.$root.api('admin/federation/update-instance', {
				host: this.instance.host,
				isBlocked: this.instance.isBlocked,
			});
		},

		setSrc(src) {
			this.chartSrc = src;
		},

		renderChart() {
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
						formatter: v => Vue.filter('number')(v),
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
				this.chartSpan == 'day' ? new Date(y, m, d - i) :
				this.chartSpan == 'hour' ? new Date(y, m, d, h - i) :
				null
			);
		},

		format(arr) {
			return arr.map((v, i) => ({ x: this.getDate(i).getTime(), y: v }));
		},

		requestsChart(): any {
			return {
				series: [{
					name: 'Incoming',
					data: this.format(this.stats.requests.received)
				}, {
					name: 'Outgoing (succeeded)',
					data: this.format(this.stats.requests.succeeded)
				}, {
					name: 'Outgoing (failed)',
					data: this.format(this.stats.requests.failed)
				}]
			};
		},

		usersChart(total: boolean): any {
			return {
				series: [{
					name: 'Users',
					type: 'area',
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
					type: 'area',
					data: this.format(total
						? this.stats.notes.total
						: sum(this.stats.notes.inc, negate(this.stats.notes.dec))
					)
				}]
			};
		},

		followingChart(total: boolean): any {
			return {
				series: [{
					name: 'Following',
					type: 'area',
					data: this.format(total
						? this.stats.following.total
						: sum(this.stats.following.inc, negate(this.stats.following.dec))
					)
				}]
			};
		},

		followersChart(total: boolean): any {
			return {
				series: [{
					name: 'Followers',
					type: 'area',
					data: this.format(total
						? this.stats.followers.total
						: sum(this.stats.followers.inc, negate(this.stats.followers.dec))
					)
				}]
			};
		},
	}
});
</script>

<style lang="stylus" scoped>
.target
	margin-bottom 16px !important

.instances
	width 100%

	> header
		display flex

		> *
			color var(--text)
			font-weight bold

	> div
		display flex

	> * > *
		flex 1
		overflow auto

		&:first-child
			min-width 200px

</style>
