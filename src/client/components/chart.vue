<template>
<div class="cbbedffa">
	<canvas ref="chartEl"></canvas>
	<div v-if="fetching" class="fetching">
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch, PropType } from 'vue';
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
	SubTitle,
	Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';
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
	SubTitle,
	Filler,
	zoomPlugin,
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

const colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560'];
const getColor = (i) => {
	return colors[i % colors.length];
};

export default defineComponent({
	props: {
		src: {
			type: String,
			required: true,
		},
		args: {
			type: Object,
			required: false,
		},
		limit: {
			type: Number,
			required: false,
			default: 90
		},
		span: {
			type: String as PropType<'hour' | 'day'>,
			required: true,
		},
		detailed: {
			type: Boolean,
			required: false,
			default: false
		},
		stacked: {
			type: Boolean,
			required: false,
			default: false
		},
		aspectRatio: {
			type: Number,
			required: false,
			default: null
		},
	},

	setup(props) {
		const now = new Date();
		let chartInstance: Chart = null;
		let data: {
			series: {
				name: string;
				type: 'line' | 'area';
				color?: string;
				borderDash?: number[];
				hidden?: boolean;
				data: {
					x: number;
					y: number;
				}[];
			}[];
		} = null;

		const chartEl = ref<HTMLCanvasElement>(null);
		const fetching = ref(true);

		const getDate = (ago: number) => {
			const y = now.getFullYear();
			const m = now.getMonth();
			const d = now.getDate();
			const h = now.getHours();

			return props.span === 'day' ? new Date(y, m, d - ago) : new Date(y, m, d, h - ago);
		};

		const format = (arr) => {
			return arr.map((v, i) => ({
				x: getDate(i).getTime(),
				y: v
			}));
		};

		const render = () => {
			if (chartInstance) {
				chartInstance.destroy();
			}

			const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

			// フォントカラー
			Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

			chartInstance = new Chart(chartEl.value, {
				type: 'line',
				data: {
					labels: new Array(props.limit).fill(0).map((_, i) => getDate(i).toLocaleString()).slice().reverse(),
					datasets: data.series.map((x, i) => ({
						parsing: false,
						label: x.name,
						data: x.data.slice().reverse(),
						pointRadius: 0,
						tension: 0,
						borderWidth: 2,
						borderColor: x.color ? x.color : getColor(i),
						borderDash: x.borderDash || [],
						borderJoinStyle: 'round',
						backgroundColor: alpha(x.color ? x.color : getColor(i), 0.1),
						fill: x.type === 'area',
						hidden: !!x.hidden,
					})),
				},
				options: {
					aspectRatio: props.aspectRatio || 2.5,
					layout: {
						padding: {
							left: 16,
							right: 16,
							top: 16,
							bottom: 8,
						},
					},
					scales: {
						x: {
							type: 'time',
							time: {
								stepSize: 1,
								unit: props.span === 'day' ? 'month' : 'day',
							},
							grid: {
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
							min: getDate(props.limit).getTime(),
						},
						y: {
							position: 'left',
							stacked: props.stacked,
							grid: {
								color: gridColor,
								borderColor: 'rgb(0, 0, 0, 0)',
							},
							ticks: {
								display: props.detailed,
							},
						},
					},
					interaction: {
						intersect: false,
					},
					plugins: {
						legend: {
							display: props.detailed,
							position: 'bottom',
							labels: {
								boxWidth: 16,
							},
						},
						tooltip: {
							mode: 'index',
							animation: {
								duration: 0,
							},
						},
						zoom: {
							pan: {
								enabled: true,
							},
							zoom: {
								wheel: {
									enabled: true,
								},
								pinch: {
									enabled: true,
								},
								drag: {
									enabled: false,
								},
								mode: 'x',
							},
							limits: {
								x: {
									min: 'original',
									max: 'original',
								},
								y: {
									min: 'original',
									max: 'original',
								},
							}
						},
					},
				},
			});
		};

		const exportData = () => {
			// TODO
		};

		const fetchFederationInstancesChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/federation', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Instances',
					type: 'area',
					data: format(total
						? raw.instance.total
						: sum(raw.instance.inc, negate(raw.instance.dec))
					),
				}],
			};
		};

		const fetchNotesChart = async (type: string): Promise<typeof data> => {
			const raw = await os.api('charts/notes', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'All',
					type: 'line',
					borderDash: [5, 5],
					data: format(type == 'combined'
						? sum(raw.local.inc, negate(raw.local.dec), raw.remote.inc, negate(raw.remote.dec))
						: sum(raw[type].inc, negate(raw[type].dec))
					),
				}, {
					name: 'Renotes',
					type: 'area',
					data: format(type == 'combined'
						? sum(raw.local.diffs.renote, raw.remote.diffs.renote)
						: raw[type].diffs.renote
					),
				}, {
					name: 'Replies',
					type: 'area',
					data: format(type == 'combined'
						? sum(raw.local.diffs.reply, raw.remote.diffs.reply)
						: raw[type].diffs.reply
					),
				}, {
					name: 'Normal',
					type: 'area',
					data: format(type == 'combined'
						? sum(raw.local.diffs.normal, raw.remote.diffs.normal)
						: raw[type].diffs.normal
					),
				}],
			};
		};

		const fetchNotesTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/notes', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: format(sum(raw.local.total, raw.remote.total)),
				}, {
					name: 'Local',
					type: 'area',
					data: format(raw.local.total),
				}, {
					name: 'Remote',
					type: 'area',
					data: format(raw.remote.total),
				}],
			};
		};

		const fetchUsersChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/users', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: format(total
						? sum(raw.local.total, raw.remote.total)
						: sum(raw.local.inc, negate(raw.local.dec), raw.remote.inc, negate(raw.remote.dec))
					),
				}, {
					name: 'Local',
					type: 'area',
					data: format(total
						? raw.local.total
						: sum(raw.local.inc, negate(raw.local.dec))
					),
				}, {
					name: 'Remote',
					type: 'area',
					data: format(total
						? raw.remote.total
						: sum(raw.remote.inc, negate(raw.remote.dec))
					),
				}],
			};
		};

		const fetchActiveUsersChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/active-users', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: format(sum(raw.local.users, raw.remote.users)),
				}, {
					name: 'Local',
					type: 'area',
					data: format(raw.local.users),
				}, {
					name: 'Remote',
					type: 'area',
					data: format(raw.remote.users),
				}],
			};
		};

		const fetchDriveChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.limit, span: props.span });
			return {
				bytes: true,
				series: [{
					name: 'All',
					type: 'line',
					borderDash: [5, 5],
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
					data: format(raw.local.incSize),
				}, {
					name: 'Local -',
					type: 'area',
					data: format(negate(raw.local.decSize)),
				}, {
					name: 'Remote +',
					type: 'area',
					data: format(raw.remote.incSize),
				}, {
					name: 'Remote -',
					type: 'area',
					data: format(negate(raw.remote.decSize)),
				}],
			};
		};

		const fetchDriveTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.limit, span: props.span });
			return {
				bytes: true,
				series: [{
					name: 'Combined',
					type: 'line',
					data: format(sum(raw.local.totalSize, raw.remote.totalSize)),
				}, {
					name: 'Local',
					type: 'area',
					data: format(raw.local.totalSize),
				}, {
					name: 'Remote',
					type: 'area',
					data: format(raw.remote.totalSize),
				}],
			};
		};

		const fetchDriveFilesChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'All',
					type: 'line',
					borderDash: [5, 5],
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
					data: format(raw.local.incCount),
				}, {
					name: 'Local -',
					type: 'area',
					data: format(negate(raw.local.decCount)),
				}, {
					name: 'Remote +',
					type: 'area',
					data: format(raw.remote.incCount),
				}, {
					name: 'Remote -',
					type: 'area',
					data: format(negate(raw.remote.decCount)),
				}],
			};
		};

		const fetchDriveFilesTotalChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/drive', { limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Combined',
					type: 'line',
					data: format(sum(raw.local.totalCount, raw.remote.totalCount)),
				}, {
					name: 'Local',
					type: 'area',
					data: format(raw.local.totalCount),
				}, {
					name: 'Remote',
					type: 'area',
					data: format(raw.remote.totalCount),
				}],
			};
		};

		const fetchInstanceRequestsChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'In',
					type: 'area',
					color: '#008FFB',
					data: format(raw.requests.received)
				}, {
					name: 'Out (succ)',
					type: 'area',
					color: '#00E396',
					data: format(raw.requests.succeeded)
				}, {
					name: 'Out (fail)',
					type: 'area',
					color: '#FEB019',
					data: format(raw.requests.failed)
				}]
			};
		};

		const fetchInstanceUsersChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Users',
					type: 'area',
					color: '#008FFB',
					data: format(total
						? raw.users.total
						: sum(raw.users.inc, negate(raw.users.dec))
					)
				}]
			};
		};

		const fetchInstanceNotesChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Notes',
					type: 'area',
					color: '#008FFB',
					data: format(total
						? raw.notes.total
						: sum(raw.notes.inc, negate(raw.notes.dec))
					)
				}]
			};
		};

		const fetchInstanceFfChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Following',
					type: 'area',
					color: '#008FFB',
					data: format(total
						? raw.following.total
						: sum(raw.following.inc, negate(raw.following.dec))
					)
				}, {
					name: 'Followers',
					type: 'area',
					color: '#00E396',
					data: format(total
						? raw.followers.total
						: sum(raw.followers.inc, negate(raw.followers.dec))
					)
				}]
			};
		};

		const fetchInstanceDriveUsageChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				bytes: true,
				series: [{
					name: 'Drive usage',
					type: 'area',
					color: '#008FFB',
					data: format(total
						? raw.drive.totalUsage
						: sum(raw.drive.incUsage, negate(raw.drive.decUsage))
					)
				}]
			};
		};

		const fetchInstanceDriveFilesChart = async (total: boolean): Promise<typeof data> => {
			const raw = await os.api('charts/instance', { host: props.args.host, limit: props.limit, span: props.span });
			return {
				series: [{
					name: 'Drive files',
					type: 'area',
					color: '#008FFB',
					data: format(total
						? raw.drive.totalFiles
						: sum(raw.drive.incFiles, negate(raw.drive.decFiles))
					)
				}]
			};
		};

		const fetchPerUserNotesChart = async (): Promise<typeof data> => {
			const raw = await os.api('charts/user/notes', { userId: props.args.user.id, limit: props.limit, span: props.span });
			return {
				series: [...(props.args.withoutAll ? [] : [{
					name: 'All',
					type: 'line',
					borderDash: [5, 5],
					data: format(sum(raw.inc, negate(raw.dec))),
				}]), {
					name: 'Renotes',
					type: 'area',
					data: format(raw.diffs.renote),
				}, {
					name: 'Replies',
					type: 'area',
					data: format(raw.diffs.reply),
				}, {
					name: 'Normal',
					type: 'area',
					data: format(raw.diffs.normal),
				}],
			};
		};

		const fetchAndRender = async () => {
			const fetchData = () => {
				switch (props.src) {
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
					
					case 'instance-requests': return fetchInstanceRequestsChart();
					case 'instance-users': return fetchInstanceUsersChart(false);
					case 'instance-users-total': return fetchInstanceUsersChart(true);
					case 'instance-notes': return fetchInstanceNotesChart(false);
					case 'instance-notes-total': return fetchInstanceNotesChart(true);
					case 'instance-ff': return fetchInstanceFfChart(false);
					case 'instance-ff-total': return fetchInstanceFfChart(true);
					case 'instance-drive-usage': return fetchInstanceDriveUsageChart(false);
					case 'instance-drive-usage-total': return fetchInstanceDriveUsageChart(true);
					case 'instance-drive-files': return fetchInstanceDriveFilesChart(false);
					case 'instance-drive-files-total': return fetchInstanceDriveFilesChart(true);

					case 'per-user-notes': return fetchPerUserNotesChart();
				}
			};
			fetching.value = true;
			data = await fetchData();
			fetching.value = false;
			render();
		};

		watch(() => [props.src, props.span], fetchAndRender);

		onMounted(() => {
			fetchAndRender();
		});

		return {
			chartEl,
			fetching,
		};
	},
});
</script>

<style lang="scss" scoped>
.cbbedffa {
	position: relative;

	> .fetching {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		-webkit-backdrop-filter: var(--blur, blur(12px));
		backdrop-filter: var(--blur, blur(12px));
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: wait;
	}
}
</style>
