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

<script lang="ts" setup>
import { markRaw, nextTick, onMounted, onBeforeUnmount } from 'vue';
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
import MkButton from '@/components/ui/button.vue';
import MkSelect from '@/components/form/select.vue';
import MkInput from '@/components/form/input.vue';
import MkContainer from '@/components/ui/container.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkwFederation from '../../widgets/federation.vue';
import { version, url } from '@/config';
import bytes from '@/filters/bytes';
import number from '@/filters/number';
import * as os from '@/os';
import { stream } from '@/stream';
import { defaultStore } from '@/store';

let stats: any = $ref(null);
let serverInfo: any = $ref(null);
let connection: any = $ref(null);
let queueConnection: any = markRaw(stream.useChannel('queueStats'));
let memUsage: number = $ref(0);
let chartCpuMem: any = $ref(null);
let chartNet: any = $ref(null);
let jobs: any[] = $ref([]);
let logs: any[] = $ref([]);
let logLevel: string = $ref('all');
let logDomain: string = $ref('');
let modLogs: any[] = $ref([]);
let dbInfo: any = $ref(null);
let overviewHeight: string = $ref('1fr');
let queueHeight: string = $ref('1fr');
let paused: boolean = $ref(false);

const gridColor = $computed(() => defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');

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

function cpumem(el) {
	if (chartCpuMem != null) return;
	chartCpuMem = markRaw(new Chart(el, {
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
						color: gridColor,
						zeroLineColor: gridColor,
					},
					ticks: {
						display: false,
					}
				},
				y: {
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
				}
			},
			tooltips: {
				intersect: false,
				mode: 'index',
			}
		}
	}));
}

function net(el) {
	if (chartNet != null) return;
	chartNet = markRaw(new Chart(el, {
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
						color: gridColor,
						zeroLineColor: gridColor,
					},
					ticks: {
						display: false
					}
				},
				y: {
					position: 'right',
					gridLines: {
						display: true,
						color: gridColor,
						zeroLineColor: gridColor,
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
}

function disk(el) {
	if (chartDisk != null) return;
	chartDisk = markRaw(new Chart(el, {
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
}

function fetchJobs() {
	os.api('admin/queue/deliver-delayed', {}).then(jobsResponse => {
		jobs = jobsResponse;
	});
}

function onStats(stats) {
	if (paused) return;

	const cpu = (stats.cpu * 100).toFixed(0);
	const memActive = (stats.mem.active / serverInfo.mem.total * 100).toFixed(0);
	const memUsed = (stats.mem.used / serverInfo.mem.total * 100).toFixed(0);
	memUsage = stats.mem.active;

	chartCpuMem.data.labels.push('');
	chartCpuMem.data.datasets[0].data.push(cpu);
	chartCpuMem.data.datasets[1].data.push(memActive);
	chartCpuMem.data.datasets[2].data.push(memUsed);
	chartNet.data.labels.push('');
	chartNet.data.datasets[0].data.push(stats.net.rx);
	chartNet.data.datasets[1].data.push(stats.net.tx);
	chartDisk.data.labels.push('');
	chartDisk.data.datasets[0].data.push(stats.fs.r);
	chartDisk.data.datasets[1].data.push(stats.fs.w);
	if (chartCpuMem.data.datasets[0].data.length > 150) {
		chartCpuMem.data.labels.shift();
		chartCpuMem.data.datasets[0].data.shift();
		chartCpuMem.data.datasets[1].data.shift();
		chartCpuMem.data.datasets[2].data.shift();
		chartNet.data.labels.shift();
		chartNet.data.datasets[0].data.shift();
		chartNet.data.datasets[1].data.shift();
		chartDisk.data.labels.shift();
		chartDisk.data.datasets[0].data.shift();
		chartDisk.data.datasets[1].data.shift();
	}

	chartCpuMem.update();
	chartNet.update();
	chartDisk.update();
}

function onStatsLog(statsLog) {
	for (const stats of [...statsLog].reverse()) {
		onStats(stats);
	}
}

function pause() {
	paused = true;
}

function resume() {
	paused = false;
}

onMounted(() => {
	fetchJobs();

	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	os.api('admin/server-info', {}).then(res => {
		serverInfo = res;

		connection = markRaw(stream.useChannel('serverStats'));
		connection.on('stats', onStats);
		connection.on('statsLog', onStatsLog);
		connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 150
		});

		nextTick(() => {
			queueConnection.send('requestLog', {
				id: Math.random().toString().substr(2, 8),
				length: 200
			});
		});
	});
});

onBeforeUnmount(() => {
		if (connection) {
			connection.off('stats', onStats);
			connection.off('statsLog', onStatsLog);
			connection.dispose();
		}

		queueConnection.dispose();
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
