<template>
<div class="zbcjwnqg" style="margin-top: -8px;">
	<div class="selects" style="display: flex;">
		<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
			<optgroup :label="$ts.federation">
				<option value="federation-instances">{{ $ts._charts.federationInstancesIncDec }}</option>
				<option value="federation-instances-total">{{ $ts._charts.federationInstancesTotal }}</option>
			</optgroup>
			<optgroup :label="$ts.users">
				<option value="users">{{ $ts._charts.usersIncDec }}</option>
				<option value="users-total">{{ $ts._charts.usersTotal }}</option>
				<option value="active-users">{{ $ts._charts.activeUsers }}</option>
			</optgroup>
			<optgroup :label="$ts.notes">
				<option value="notes">{{ $ts._charts.notesIncDec }}</option>
				<option value="local-notes">{{ $ts._charts.localNotesIncDec }}</option>
				<option value="remote-notes">{{ $ts._charts.remoteNotesIncDec }}</option>
				<option value="notes-total">{{ $ts._charts.notesTotal }}</option>
			</optgroup>
			<optgroup :label="$ts.drive">
				<option value="drive-files">{{ $ts._charts.filesIncDec }}</option>
				<option value="drive-files-total">{{ $ts._charts.filesTotal }}</option>
				<option value="drive">{{ $ts._charts.storageUsageIncDec }}</option>
				<option value="drive-total">{{ $ts._charts.storageUsageTotal }}</option>
			</optgroup>
		</MkSelect>
		<MkSelect v-model="chartSpan" style="margin: 0;">
			<option value="hour">{{ $ts.perHour }}</option>
			<option value="day">{{ $ts.perDay }}</option>
		</MkSelect>
	</div>
	<canvas ref="chartEl"></canvas>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
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
	TimeScale,
  Legend,
  Title,
  Tooltip,
  SubTitle
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import MkSelect from './form/select.vue';
import number from '@client/filters/number';
import * as os from '@client/os';
import { defaultStore } from '@client/store';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
	TimeScale,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

const sum = (...arr) => arr.reduce((r, a) => r.map((b, i) => a[i] + b));
const negate = arr => arr.map(x => -x);
const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

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

	setup(props) {
		const now = new Date();
		let chartInstance: Chart = null;
		let data: {
			series: {
				name: string;
				color: string;
				borderDash?: number[];
				fill?: boolean;
				hidden?: boolean;
				data: {
					x: number;
					y: number;
				}[];
			}[];
		} = null;

		const chartEl = ref<HTMLCanvasElement>(null);
		const chartSpan = ref<'hour' | 'day'>('hour');
		const chartSrc = ref('notes');
		const fetching = ref(true);

		const getDate = (ago: number) => {
			const y = now.getFullYear();
			const m = now.getMonth();
			const d = now.getDate();
			const h = now.getHours();

			return chartSpan.value === 'day' ? new Date(y, m, d - ago) : new Date(y, m, d, h - ago);
		};

		const format = (arr) => {
			return arr.map((v, i) => ({
				x: getDate(i),
				y: v
			}));
		};

		const render = () => {
			if (chartInstance) {
				chartInstance.destroy();
			}

			// TODO: var(--panel)の色が暗いか明るいかで判定する
			const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

			// フォントカラー
			Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

			chartInstance = new Chart(chartEl.value, {
				type: 'line',
				data: {
					labels: new Array(props.chartLimit).fill(0).map((_, i) => getDate(i).toLocaleString()).slice().reverse(),
					datasets: data.series.map(x => ({
						label: x.name,
						data: x.data.slice().reverse(),
						pointRadius: 0,
						lineTension: 0,
						borderWidth: 2,
						borderColor: x.color,
						borderDash: x.borderDash || [],
						backgroundColor: alpha(x.color, 0.1),
						fill: x.fill == null ? true : x.fill,
						hidden: !!x.hidden,
					})),
				},
				options: {
					aspectRatio: 2.5,
					layout: {
						padding: {
							left: 16,
							right: 16,
							top: 16,
							bottom: 8,
						},
					},
					legend: {
						position: 'bottom',
						labels: {
							boxWidth: 16,
						},
					},
					scales: {
						x: {
							type: 'time',
							time: {
								stepSize: 1,
								unit: chartSpan.value == 'day' ? 'month' : 'day',
							},
							grid: {
								display: props.detailed,
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
							ticks: {
								display: props.detailed,
							},
							adapters: {
								date: {
									locale: enUS,
								},
							},
						},
						y: {
							position: 'left',
							grid: {
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
							ticks: {
								display: props.detailed,
							},
						},
					},
					tooltips: {
						intersect: false,
						mode: 'index',
					},
				},
			});
		};

		const exportData = () => {
			// TODO
		};

		const fetchFederationInstancesChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/federation', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'Instances',
					color: '#008FFB',
					data: format(total
						? raw.instance.total
						: sum(raw.instance.inc, negate(raw.instance.dec))
					),
				}],
			};
		};

		const fetchNotesChart = async (type: string): Promise<typeof data> => {
			const raw = await os.api('charts/notes', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'All',
					type: 'line',
					color: '#008FFB',
					borderDash: [5, 5],
					fill: false,
					data: format(type == 'combined'
						? sum(raw.local.inc, negate(raw.local.dec), raw.remote.inc, negate(raw.remote.dec))
						: sum(raw[type].inc, negate(raw[type].dec))
					),
				}, {
					name: 'Renotes',
					type: 'area',
					color: '#00E396',
					data: format(type == 'combined'
						? sum(raw.local.diffs.renote, raw.remote.diffs.renote)
						: raw[type].diffs.renote
					),
				}, {
					name: 'Replies',
					type: 'area',
					color: '#FEB019',
					data: format(type == 'combined'
						? sum(raw.local.diffs.reply, raw.remote.diffs.reply)
						: raw[type].diffs.reply
					),
				}, {
					name: 'Normal',
					type: 'area',
					color: '#FF4560',
					data: format(type == 'combined'
						? sum(raw.local.diffs.normal, raw.remote.diffs.normal)
						: raw[type].diffs.normal
					),
				}],
			};
		};

		const fetchNotesTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/notes', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: format(sum(raw.local.total, raw.remote.total)),
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.local.total),
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.remote.total),
				}],
			};
		};

		const fetchUsersChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/users', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: format(total
						? sum(raw.local.total, raw.remote.total)
						: sum(raw.local.inc, negate(raw.local.dec), raw.remote.inc, negate(raw.remote.dec))
					),
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(total
						? raw.local.total
						: sum(raw.local.inc, negate(raw.local.dec))
					),
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(total
						? raw.remote.total
						: sum(raw.remote.inc, negate(raw.remote.dec))
					),
				}],
			};
		};

		const fetchActiveUsersChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/active-users', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: format(sum(raw.local.count, raw.remote.count)),
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.local.count),
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.remote.count),
				}],
			};
		};

		const fetchDriveChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.chartLimit, span: chartSpan.value });
			return {
				bytes: true,
				series: [{
					name: 'All',
					type: 'line',
					color: '#09d8e2',
					borderDash: [5, 5],
					fill: false,
					data: format(
						sum(
							raw.local.incSize,
							negate(raw.local.decSize),
							raw.remote.incSize,
							negate(raw.remote.decSize)
						)
					),
				}, {
					name: 'Local +',
					type: 'area',
					color: '#008FFB',
					data: format(raw.local.incSize),
				}, {
					name: 'Local -',
					type: 'area',
					color: '#FF4560',
					data: format(negate(raw.local.decSize)),
				}, {
					name: 'Remote +',
					type: 'area',
					color: '#00E396',
					data: format(raw.remote.incSize),
				}, {
					name: 'Remote -',
					type: 'area',
					color: '#FEB019',
					data: format(negate(raw.remote.decSize)),
				}],
			};
		};

		const fetchDriveTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.chartLimit, span: chartSpan.value });
			return {
				bytes: true,
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: format(sum(raw.local.totalSize, raw.remote.totalSize)),
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.local.totalSize),
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.remote.totalSize),
				}],
			};
		};

		const fetchDriveFilesChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'All',
					type: 'line',
					color: '#09d8e2',
					borderDash: [5, 5],
					fill: false,
					data: format(
						sum(
							raw.local.incCount,
							negate(raw.local.decCount),
							raw.remote.incCount,
							negate(raw.remote.decCount)
						)
					),
				}, {
					name: 'Local +',
					type: 'area',
					color: '#008FFB',
					data: format(raw.local.incCount),
				}, {
					name: 'Local -',
					type: 'area',
					color: '#FF4560',
					data: format(negate(raw.local.decCount)),
				}, {
					name: 'Remote +',
					type: 'area',
					color: '#00E396',
					data: format(raw.remote.incCount),
				}, {
					name: 'Remote -',
					type: 'area',
					color: '#FEB019',
					data: format(negate(raw.remote.decCount)),
				}],
			};
		};

		const fetchDriveFilesTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.chartLimit, span: chartSpan.value });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					color: '#008FFB',
					data: format(sum(raw.local.totalCount, raw.remote.totalCount)),
				}, {
					name: 'Local',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.local.totalCount),
				}, {
					name: 'Remote',
					type: 'area',
					color: '#008FFB',
					hidden: true,
					data: format(raw.remote.totalCount),
				}],
			};
		};

		const fetchAndRender = async () => {
			const fetchData = () => {
				switch (chartSrc.value) {
					case 'federation-instances': return fetchFederationInstancesChart(false);
					case 'federation-instances-total': return fetchFederationInstancesChart(true);
					case 'users': return fetchUsersChart(false);
					case 'users-total': return fetchUsersChart(true);
					case 'active-users': return fetchActiveUsersChart();
					case 'notes': return fetchNotesChart('combined');
					case 'local-notes': return fetchNotesChart('local');
					case 'remote-notes': return fetchNotesChart('remote');
					case 'notes-total': return fetchNotesTotalChart();
					case 'drive': return fetchDriveChart();
					case 'drive-total': return fetchDriveTotalChart();
					case 'drive-files': return fetchDriveFilesChart();
					case 'drive-files-total': return fetchDriveFilesTotalChart();
				}
			};
			fetching.value = true;
			data = await fetchData();
			fetching.value = false;
			render();
		};

		watch([chartSrc, chartSpan], fetchAndRender);

		onMounted(() => {
			fetchAndRender();
		});

		return {
			chartEl,
			chartSrc,
			chartSpan,
		};
	},
});
</script>

<style lang="scss" scoped>
.zbcjwnqg {
	> .selects {
		padding: 8px 16px 0 16px;
	}
}
</style>
