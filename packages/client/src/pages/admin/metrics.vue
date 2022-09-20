<template>
<div class="_debobigegoItem">
	<div class="_debobigegoLabel"><i class="fas fa-microchip"></i> {{ $ts.cpuAndMemory }}</div>
	<div class="_debobigegoPanel xhexznfu">
		<div>
			<canvas :ref="cpumem"></canvas>
		</div>
		<div v-if="serverInfo">
			<div class="_table">
				<div class="_row">
					<div class="_cell"><div class="_label">MEM total</div>{{ bytes(serverInfo.mem.total) }}</div>
					<div class="_cell"><div class="_label">MEM used</div>{{ bytes(memUsage) }} ({{ (memUsage / serverInfo.mem.total * 100).toFixed(0) }}%)</div>
					<div class="_cell"><div class="_label">MEM free</div>{{ bytes(serverInfo.mem.total - memUsage) }} ({{ ((serverInfo.mem.total - memUsage) / serverInfo.mem.total * 100).toFixed(0) }}%)</div>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="_debobigegoItem">
	<div class="_debobigegoLabel"><i class="fas fa-hdd"></i> {{ $ts.disk }}</div>
	<div class="_debobigegoPanel xhexznfu">
		<div>
			<canvas :ref="disk"></canvas>
		</div>
		<div v-if="serverInfo">
			<div class="_table">
				<div class="_row">
					<div class="_cell"><div class="_label">Disk total</div>{{ bytes(serverInfo.fs.total) }}</div>
					<div class="_cell"><div class="_label">Disk used</div>{{ bytes(serverInfo.fs.used) }} ({{ (serverInfo.fs.used / serverInfo.fs.total * 100).toFixed(0) }}%)</div>
					<div class="_cell"><div class="_label">Disk free</div>{{ bytes(serverInfo.fs.total - serverInfo.fs.used) }} ({{ ((serverInfo.fs.total - serverInfo.fs.used) / serverInfo.fs.total * 100).toFixed(0) }}%)</div>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="_debobigegoItem">
	<div class="_debobigegoLabel"><i class="fas fa-exchange-alt"></i> {{ $ts.network }}</div>
	<div class="_debobigegoPanel xhexznfu">
		<div>
			<canvas :ref="net"></canvas>
		</div>
		<div v-if="serverInfo">
			<div class="_table">
				<div class="_row">
					<div class="_cell"><div class="_label">Interface</div>{{ serverInfo.net.interface }}</div>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Legend,
  Title,
  Tooltip,
  SubTitle
} from 'chart.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/form/select.vue';
import MkInput from '@/components/form/input.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkwFederation from '../../widgets/federation.vue';
import { version, url } from '@/config';
import bytes from '@/filters/bytes';
import number from '@/filters/number';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};
import * as os from '@/os';
import { stream } from '@/stream';

export default defineComponent({
	components: {
		MkButton,
		MkSelect,
		MkInput,
		MkContainer,
		MkFolder,
		MkwFederation,
	},

	data() {
		return {
			version,
			url,
			stats: null,
			serverInfo: null,
			connection: null,
			queueConnection: markRaw(stream.useChannel('queueStats')),
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
		};
	},

	computed: {
		gridColor() {
			// TODO: var(--panel)の色が暗いか明るいかで判定する
			return this.$store.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
		},
	},

	mounted() {
		this.fetchJobs();

		Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

		os.api('admin/server-info', {}).then(res => {
			this.serverInfo = res;

			this.connection = markRaw(stream.useChannel('serverStats'));
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
	},

	beforeUnmount() {
		if (this.connection) {
			this.connection.off('stats', this.onStats);
			this.connection.off('statsLog', this.onStatsLog);
			this.connection.dispose();
		}
		this.queueConnection.dispose();
	},

	methods: {
		cpumem(el) {
			if (this.chartCpuMem != null) return;
			this.chartCpuMem = markRaw(new Chart(el, {
				type: 'line',
				data: {
					labels: [],
					datasets: [{
						label: 'CPU',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderColor: '#86b300',
						backgroundColor: alpha('#86b300', 0.1),
						data: []
					}, {
						label: 'MEM (active)',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderColor: '#935dbf',
						backgroundColor: alpha('#935dbf', 0.02),
						data: []
					}, {
						label: 'MEM (used)',
						pointRadius: 0,
						tension: 0,
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
						x: {
							gridLines: {
								display: false,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false,
							}
						},
						y: {
							position: 'right',
							gridLines: {
								display: true,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false,
								max: 100
							}
						}
					},
					tooltips: {
						intersect: false,
						mode: 'index',
					}
				}
			}));
		},

		net(el) {
			if (this.chartNet != null) return;
			this.chartNet = markRaw(new Chart(el, {
				type: 'line',
				data: {
					labels: [],
					datasets: [{
						label: 'In',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderColor: '#94a029',
						backgroundColor: alpha('#94a029', 0.1),
						data: []
					}, {
						label: 'Out',
						pointRadius: 0,
						tension: 0,
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
						x: {
							gridLines: {
								display: false,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false
							}
						},
						y: {
							position: 'right',
							gridLines: {
								display: true,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false,
							}
						}
					},
					tooltips: {
						intersect: false,
						mode: 'index',
					}
				}
			}));
		},

		disk(el) {
			if (this.chartDisk != null) return;
			this.chartDisk = markRaw(new Chart(el, {
				type: 'line',
				data: {
					labels: [],
					datasets: [{
						label: 'Read',
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderColor: '#94a029',
						backgroundColor: alpha('#94a029', 0.1),
						data: []
					}, {
						label: 'Write',
						pointRadius: 0,
						tension: 0,
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
						x: {
							gridLines: {
								display: false,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false
							}
						},
						y: {
							position: 'right',
							gridLines: {
								display: true,
								color: this.gridColor,
								zeroLineColor: this.gridColor,
							},
							ticks: {
								display: false,
							}
						}
					},
					tooltips: {
						intersect: false,
						mode: 'index',
					}
				}
			}));
		},

		fetchJobs() {
			os.api('admin/queue/deliver-delayed', {}).then(jobs => {
				this.jobs = jobs;
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

		number,

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
	> div:nth-child(2) {
		padding: 16px;
		border-top: solid 0.5px var(--divider);
	}
}
</style>
