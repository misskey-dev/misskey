<template>
<div v-if="meta" class="xhexznfu" v-size="{ min: [1600] }">
	<portal to="header"><fa :icon="faServer"/>{{ $t('instance') }}</portal>

	<mk-folder>
		<template #header><fa :icon="faTachometerAlt"/> {{ $t('overview') }}</template>

		<div class="sboqnrfi" :style="{ gridTemplateRows: overviewHeight }">
			<mk-instance-stats :chart-limit="300" :detailed="true" class="stats" ref="stats"/>

			<div class="column">
				<mk-container :body-togglable="true" :resize-base-el="() => $el" class="info">
					<template #header><fa :icon="faInfoCircle"/>{{ $t('instanceInfo') }}</template>

					<div class="_content">
						<div class="_keyValue"><b>Misskey</b><span>v{{ version }}</span></div>
					</div>
					<div class="_content" v-if="serverInfo">
						<div class="_keyValue"><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
						<div class="_keyValue"><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
						<div class="_keyValue"><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
					</div>
				</mk-container>
				
				<mk-container :body-togglable="true" :scrollable="true" :resize-base-el="() => $el" class="db">
					<template #header><fa :icon="faDatabase"/>{{ $t('database') }}</template>

					<div class="_content" v-if="dbInfo">
						<table style="border-collapse: collapse; width: 100%;">
							<tr style="opacity: 0.7;">
								<th style="text-align: left; padding: 0 8px 8px 0;">Table</th>
								<th style="text-align: left; padding: 0 8px 8px 0;">Records</th>
								<th style="text-align: left; padding: 0 0 8px 0;">Size</th>
							</tr>
							<tr v-for="table in dbInfo" :key="table[0]">
								<th style="text-align: left; padding: 0 8px 0 0; word-break: break-all;">{{ table[0] }}</th>
								<td style="padding: 0 8px 0 0;">{{ number(table[1].count) }}</td>
								<td style="padding: 0; opacity: 0.7;">{{ bytes(table[1].size) }}</td>
							</tr>
						</table>
					</div>
				</mk-container>

				<mkw-federation class="fed" :body-togglable="true" :scrollable="true"/>
			</div>
		</div>
	</mk-folder>

	<mk-folder style="margin: var(--margin) 0;">
		<template #header><fa :icon="faHeartbeat"/> {{ $t('metrics') }}</template>

		<div class="segusily">
			<mk-container :body-togglable="false" :resize-base-el="() => $el">
				<template #header><fa :icon="faMicrochip"/>{{ $t('cpuAndMemory') }}</template>
				<template #func><button class="_button" @click="resume" :disabled="!paused"><fa :icon="faPlay"/></button><button class="_button" @click="pause" :disabled="paused"><fa :icon="faPause"/></button></template>

				<div class="_content" style="margin-top: -8px; margin-bottom: -12px;">
					<canvas ref="cpumem"></canvas>
				</div>
				<div class="_content" v-if="serverInfo">
					<div class="_table">
						<!--
						<div class="_row">
							<div class="_cell"><div class="_label">CPU</div>{{ serverInfo.cpu.model }}</div>
						</div>
						-->
						<div class="_row">
							<div class="_cell"><div class="_label">MEM total</div>{{ bytes(serverInfo.mem.total) }}</div>
							<div class="_cell"><div class="_label">MEM used</div>{{ bytes(memUsage) }} ({{ (memUsage / serverInfo.mem.total * 100).toFixed(0) }}%)</div>
							<div class="_cell"><div class="_label">MEM free</div>{{ bytes(serverInfo.mem.total - memUsage) }} ({{ ((serverInfo.mem.total - memUsage) / serverInfo.mem.total * 100).toFixed(0) }}%)</div>
						</div>
					</div>
				</div>
			</mk-container>

			<mk-container :body-togglable="false" :resize-base-el="() => $el">
				<template #header><fa :icon="faHdd"/> {{ $t('disk') }}</template>
				<template #func><button class="_button" @click="resume" :disabled="!paused"><fa :icon="faPlay"/></button><button class="_button" @click="pause" :disabled="paused"><fa :icon="faPause"/></button></template>

				<div class="_content" style="margin-top: -8px; margin-bottom: -12px;">
					<canvas ref="disk"></canvas>
				</div>
				<div class="_content" v-if="serverInfo">
					<div class="_table">
						<div class="_row">
							<div class="_cell"><div class="_label">Disk total</div>{{ bytes(serverInfo.fs.total) }}</div>
							<div class="_cell"><div class="_label">Disk used</div>{{ bytes(serverInfo.fs.used) }} ({{ (serverInfo.fs.used / serverInfo.fs.total * 100).toFixed(0) }}%)</div>
							<div class="_cell"><div class="_label">Disk free</div>{{ bytes(serverInfo.fs.total - serverInfo.fs.used) }} ({{ ((serverInfo.fs.total - serverInfo.fs.used) / serverInfo.fs.total * 100).toFixed(0) }}%)</div>
						</div>
					</div>
				</div>
			</mk-container>

			<mk-container :body-togglable="false" :resize-base-el="() => $el">
				<template #header><fa :icon="faExchangeAlt"/> {{ $t('network') }}</template>
				<template #func><button class="_button" @click="resume" :disabled="!paused"><fa :icon="faPlay"/></button><button class="_button" @click="pause" :disabled="paused"><fa :icon="faPause"/></button></template>

				<div class="_content" style="margin-top: -8px; margin-bottom: -12px;">
					<canvas ref="net"></canvas>
				</div>
				<div class="_content" v-if="serverInfo">
					<div class="_table">
						<div class="_row">
							<div class="_cell"><div class="_label">Interface</div>{{ serverInfo.net.interface }}</div>
						</div>
					</div>
				</div>
			</mk-container>
		</div>
	</mk-folder>

	<mk-folder>
		<template #header><fa :icon="faClipboardList"/> {{ $t('jobQueue') }}</template>

		<div class="vkyrmkwb" :style="{ gridTemplateRows: queueHeight }">
			<mk-container :body-togglable="false" :scrollable="true" :resize-base-el="() => $el">
				<template #header><fa :icon="faExclamationTriangle"/> {{ $t('delayed') }}</template>

				<div class="_content">
					<div class="_keyValue" v-for="job in jobs" :key="job[0]">
						<button class="_button" @click="showInstanceInfo(job[0])">{{ job[0] }}</button>
						<div style="text-align: right;">{{ number(job[1]) }} jobs</div>
					</div>
				</div>
			</mk-container>
			<x-queue :connection="queueConnection" domain="inbox" ref="queue" class="queue">
				<template #title><fa :icon="faExchangeAlt"/> In</template>
			</x-queue>
			<x-queue :connection="queueConnection" domain="deliver" class="queue">
				<template #title><fa :icon="faExchangeAlt"/> Out</template>
			</x-queue>
		</div>
	</mk-folder>

	<mk-folder>
		<template #header><fa :icon="faStream"/> {{ $t('logs') }}</template>

		<div class="uwuemslx">
			<mk-container :body-togglable="false" :resize-base-el="() => $el">
				<template #header><fa :icon="faInfoCircle"/>{{ $t('') }}</template>

				<div class="_content">
					<div class="_keyValue" v-for="log in modLogs">
						<b>{{ log.type }}</b><span>by {{ log.user.username }}</span><mk-time :time="log.createdAt" style="opacity: 0.7;"/>
					</div>
				</div>
			</mk-container>

			<section class="_card logs">
				<div class="_title"><fa :icon="faStream"/> {{ $t('serverLogs') }}</div>
				<div class="_content">
					<div class="_inputs">
						<mk-input v-model:value="logDomain" :debounce="true">
							<span>{{ $t('domain') }}</span>
						</mk-input>
						<mk-select v-model:value="logLevel">
							<template #label>{{ $t('level') }}</template>
							<option value="all">{{ $t('levels.all') }}</option>
							<option value="info">{{ $t('levels.info') }}</option>
							<option value="success">{{ $t('levels.success') }}</option>
							<option value="warning">{{ $t('levels.warning') }}</option>
							<option value="error">{{ $t('levels.error') }}</option>
							<option value="debug">{{ $t('levels.debug') }}</option>
						</mk-select>
					</div>

					<div class="logs">
						<code v-for="log in logs" :key="log.id" :class="log.level">
							<details>
								<summary><mk-time :time="log.createdAt"/> [{{ log.domain.join('.') }}] {{ log.message }}</summary>
								<vue-json-pretty v-if="log.data" :data="log.data"></vue-json-pretty>
							</details>
						</code>
					</div>
				</div>
				<div class="_footer">
					<mk-button @click="deleteAllLogs()" primary><fa :icon="faTrashAlt"/> {{ $t('deleteAll') }}</mk-button>
				</div>
			</section>
		</div>
	</mk-folder>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlay, faPause, faDatabase, faServer, faExchangeAlt, faMicrochip, faHdd, faStream, faTrashAlt, faInfoCircle, faExclamationTriangle, faTachometerAlt, faHeartbeat, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js';
import VueJsonPretty from 'vue-json-pretty';
import MkInstanceStats from '../../components/instance-stats.vue';
import MkButton from '../../components/ui/button.vue';
import MkSelect from '../../components/ui/select.vue';
import MkInput from '../../components/ui/input.vue';
import MkContainer from '../../components/ui/container.vue';
import MkFolder from '../../components/ui/folder.vue';
import MkwFederation from '../../widgets/federation.vue';
import { version, url } from '../../config';
import bytes from '../../filters/bytes';
import XQueue from './index.queue-chart.vue';
import MkInstanceInfo from './instance.vue';

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	components: {
		MkInstanceStats,
		MkButton,
		MkSelect,
		MkInput,
		MkContainer,
		MkFolder,
		MkwFederation,
		XQueue,
		VueJsonPretty,
	},

	data() {
		return {
			version,
			url,
			stats: null,
			serverInfo: null,
			connection: null,
			queueConnection: this.$root.stream.useSharedConnection('queueStats'),
			memUsage: 0,
			chartCpuMem: null,
			chartNet: null,
			jobs: [],
			logs: [],
			logLevel: 'all',
			logDomain: '',
			modLogs: [],
			dbInfo: null,
			overviewHeight: '1fr',
			queueHeight: '1fr',
			paused: false,
			faPlay, faPause, faDatabase, faServer, faExchangeAlt, faMicrochip, faHdd, faStream, faTrashAlt, faInfoCircle, faExclamationTriangle, faTachometerAlt, faHeartbeat, faClipboardList,
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	watch: {
		logLevel() {
			this.logs = [];
			this.fetchLogs();
		},
		logDomain() {
			this.logs = [];
			this.fetchLogs();
		}
	},

	created() {
		this.$store.commit('setFullView', true);
	},

	mounted() {
		this.fetchLogs();
		this.fetchJobs();
		this.fetchModLogs();

		// TODO: var(--panel)の色が暗いか明るいかで判定する
		const gridColor = this.$store.state.device.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	
		Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--fg');

		this.chartCpuMem = new Chart(this.$refs.cpumem, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'CPU',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#86b300',
					backgroundColor: alpha('#86b300', 0.1),
					data: []
				}, {
					label: 'MEM (active)',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#935dbf',
					backgroundColor: alpha('#935dbf', 0.02),
					data: []
				}, {
					label: 'MEM (used)',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#935dbf',
					borderDash: [5, 5],
					fill: false,
					data: []
				}]
			},
			options: {
				aspectRatio: 3,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 8,
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
							display: false,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false,
						}
					}],
					yAxes: [{
						position: 'right',
						gridLines: {
							display: true,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false,
							max: 100
						}
					}]
				},
				tooltips: {
					intersect: false,
					mode: 'index',
				}
			}
		});

		this.chartNet = new Chart(this.$refs.net, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'In',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#94a029',
					backgroundColor: alpha('#94a029', 0.1),
					data: []
				}, {
					label: 'Out',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#ff9156',
					backgroundColor: alpha('#ff9156', 0.1),
					data: []
				}]
			},
			options: {
				aspectRatio: 3,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 8,
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
							display: false,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false
						}
					}],
					yAxes: [{
						position: 'right',
						gridLines: {
							display: true,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false,
						}
					}]
				},
				tooltips: {
					intersect: false,
					mode: 'index',
				}
			}
		});

		this.chartDisk = new Chart(this.$refs.disk, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'Read',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#94a029',
					backgroundColor: alpha('#94a029', 0.1),
					data: []
				}, {
					label: 'Write',
					pointRadius: 0,
					lineTension: 0,
					borderWidth: 2,
					borderColor: '#ff9156',
					backgroundColor: alpha('#ff9156', 0.1),
					data: []
				}]
			},
			options: {
				aspectRatio: 3,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 8,
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
							display: false,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false
						}
					}],
					yAxes: [{
						position: 'right',
						gridLines: {
							display: true,
							color: gridColor,
							zeroLineColor: gridColor,
						},
						ticks: {
							display: false,
						}
					}]
				},
				tooltips: {
					intersect: false,
					mode: 'index',
				}
			}
		});

		this.$root.api('admin/server-info', {}).then(res => {
			this.serverInfo = res;

			this.connection = this.$root.stream.useSharedConnection('serverStats');
			this.connection.on('stats', this.onStats);
			this.connection.on('statsLog', this.onStatsLog);
			this.connection.send('requestLog', {
				id: Math.random().toString().substr(2, 8),
				length: 150
			});

			this.$nextTick(() => {
				this.queueConnection.send('requestLog', {
					id: Math.random().toString().substr(2, 8),
					length: 200
				});
			});
		});

		this.$root.api('admin/get-table-stats', {}).then(res => {
			this.dbInfo = Object.entries(res).sort((a, b) => b[1].size - a[1].size);
		});

		this.$nextTick(() => {
			new ResizeObserver((entries, observer) => {
				if (this.$refs.stats && this.$refs.stats.$el) {
					this.overviewHeight = this.$refs.stats.$el.offsetHeight + 'px';
				}
			}).observe(this.$refs.stats.$el);

			new ResizeObserver((entries, observer) => {
				if (this.$refs.queue && this.$refs.queue.$el) {
					this.queueHeight = this.$refs.queue.$el.offsetHeight + 'px';
				}
			}).observe(this.$refs.queue.$el);
		});
	},

	beforeDestroy() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
		this.connection.dispose();
		this.queueConnection.dispose();
		this.$store.commit('setFullView', false);
	},

	methods: {
		async showInstanceInfo(q) {
			let instance = q;
			if (typeof q === 'string') {
				instance = await this.$root.api('federation/show-instance', {
					host: q
				});
			}
			this.$root.new(MkInstanceInfo, {
				instance: instance
			});
		},

		fetchLogs() {
			this.$root.api('admin/logs', {
				level: this.logLevel === 'all' ? null : this.logLevel,
				domain: this.logDomain === '' ? null : this.logDomain,
				limit: 30
			}).then(logs => {
				this.logs = logs.reverse();
			});
		},

		fetchJobs() {
			this.$root.api('admin/queue/deliver-delayed', {}).then(jobs => {
				this.jobs = jobs;
			});
		},

		fetchModLogs() {
			this.$root.api('admin/show-moderation-logs', {}).then(logs => {
				this.modLogs = logs;
			});
		},

		deleteAllLogs() {
			this.$root.api('admin/delete-logs').then(() => {
				this.$root.showDialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		onStats(stats) {
			if (this.paused) return;

			const cpu = (stats.cpu * 100).toFixed(0);
			const memActive = (stats.mem.active / this.serverInfo.mem.total * 100).toFixed(0);
			const memUsed = (stats.mem.used / this.serverInfo.mem.total * 100).toFixed(0);
			this.memUsage = stats.mem.active;

			this.chartCpuMem.data.labels.push('');
			this.chartCpuMem.data.datasets[0].data.push(cpu);
			this.chartCpuMem.data.datasets[1].data.push(memActive);
			this.chartCpuMem.data.datasets[2].data.push(memUsed);
			this.chartNet.data.labels.push('');
			this.chartNet.data.datasets[0].data.push(stats.net.rx);
			this.chartNet.data.datasets[1].data.push(stats.net.tx);
			this.chartDisk.data.labels.push('');
			this.chartDisk.data.datasets[0].data.push(stats.fs.r);
			this.chartDisk.data.datasets[1].data.push(stats.fs.w);
			if (this.chartCpuMem.data.datasets[0].data.length > 150) {
				this.chartCpuMem.data.labels.shift();
				this.chartCpuMem.data.datasets[0].data.shift();
				this.chartCpuMem.data.datasets[1].data.shift();
				this.chartCpuMem.data.datasets[2].data.shift();
				this.chartNet.data.labels.shift();
				this.chartNet.data.datasets[0].data.shift();
				this.chartNet.data.datasets[1].data.shift();
				this.chartDisk.data.labels.shift();
				this.chartDisk.data.datasets[0].data.shift();
				this.chartDisk.data.datasets[1].data.shift();
			}
			this.chartCpuMem.update();
			this.chartNet.update();
			this.chartDisk.update();
		},

		onStatsLog(statsLog) {
			for (const stats of [...statsLog].reverse()) {
				this.onStats(stats);
			}
		},

		bytes,

		pause() {
			this.paused = true;
		},

		resume() {
			this.paused = false;
		},
	}
});
</script>

<style lang="scss" scoped>
.xhexznfu {
	&.min-width_1600px {
		.sboqnrfi {
			display: grid;
			grid-template-columns: 3.2fr 1fr;
			grid-template-rows: 1fr;
			gap: 16px 16px;

			> .stats {
				height: min-content;
			}

			> .column {
				display: flex;
				flex-direction: column;

				> .info {
					flex-shrink: 0;
					flex-grow: 0;
				}

				> .db {
					flex: 1;
					flex-grow: 0;
					height: 100%;
				}

				> .fed {
					flex: 1;
					flex-grow: 0;
					height: 100%;
				}

				> *:not(:last-child) {
					margin-bottom: var(--margin);
				}
			}
		}

		.segusily {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			grid-template-rows: 1fr;
			gap: 16px 16px;
		}

		.vkyrmkwb {
			display: grid;
			grid-template-columns: 0.5fr 1fr 1fr;
			grid-template-rows: 1fr;
			gap: 16px 16px;
			margin-bottom: var(--margin);

			> .queue {
				height: min-content;
			}

			> * {
				margin-bottom: 0;
			}
		}

		.uwuemslx {
			display: grid;
			grid-template-columns: 2fr 3fr;
			grid-template-rows: 1fr;
			gap: 16px 16px;
			height: 400px;
		}
	}

	.vkyrmkwb {
		> * {
			margin-bottom: var(--margin);
		}
	}

	> .stats {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		margin: calc(0px - var(--margin) / 2);
		margin-bottom: calc(var(--margin) / 2);

		> div {
			flex: 1 0 213px;
			margin: calc(var(--margin) / 2);
			box-sizing: border-box;
			padding: 16px;
		}
	}

	> .logs {
		> ._content {
			> .logs {
				padding: 8px;
				background: #000;
				color: #fff;
				font-size: 0.9em;

				> code {
					display: block;

					&.error {
						color: #f00;
					}

					&.warning {
						color: #ff0;
					}

					&.success {
						color: #0f0;
					}

					&.debug {
						opacity: 0.7;
					}
				}
			}
		}
	}
}
</style>
