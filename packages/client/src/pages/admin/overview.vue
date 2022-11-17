<template>
<MkSpacer :content-max="900">
	<div ref="rootEl" v-size="{ max: [740] }" class="edbbcaef">
		<div class="left">
			<div v-if="stats" class="container stats">
				<div class="title">Stats</div>
				<div class="body">
					<div class="number _panel">
						<div class="label">Users</div>
						<div class="value _monospace">
							{{ number(stats.originalUsersCount) }}
							<MkNumberDiff v-if="usersComparedToThePrevDay != null" v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="usersComparedToThePrevDay"><template #before>(</template><template #after>)</template></MkNumberDiff>
						</div>
					</div>
					<div class="number _panel">
						<div class="label">Notes</div>
						<div class="value _monospace">
							{{ number(stats.originalNotesCount) }}
							<MkNumberDiff v-if="notesComparedToThePrevDay != null" v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="notesComparedToThePrevDay"><template #before>(</template><template #after>)</template></MkNumberDiff>
						</div>
					</div>
				</div>
			</div>

			<div class="container queue">
				<div class="title">Job queue</div>
				<div class="body">
					<div class="chart deliver">
						<div class="title">Deliver</div>
						<XQueueChart :connection="queueStatsConnection" domain="deliver"/>
					</div>
					<div class="chart inbox">
						<div class="title">Inbox</div>
						<XQueueChart :connection="queueStatsConnection" domain="inbox"/>
					</div>
				</div>
			</div>

			<div class="container users">
				<div class="title">New users</div>
				<div v-if="newUsers" class="body">
					<XUser v-for="user in newUsers" :key="user.id" class="user" :user="user"/>
				</div>
			</div>

			<div class="container files">
				<div class="title">Recent files</div>
				<div class="body">
					<MkFileListForAdmin :pagination="filesPagination" view-mode="grid"/>
				</div>
			</div>

			<div class="container env">
				<div class="title">Enviroment</div>
				<div class="body">
					<div class="number _panel">
						<div class="label">Misskey</div>
						<div class="value _monospace">{{ version }}</div>
					</div>
					<div v-if="serverInfo" class="number _panel">
						<div class="label">Node.js</div>
						<div class="value _monospace">{{ serverInfo.node }}</div>
					</div>
					<div v-if="serverInfo" class="number _panel">
						<div class="label">PostgreSQL</div>
						<div class="value _monospace">{{ serverInfo.psql }}</div>
					</div>
					<div v-if="serverInfo" class="number _panel">
						<div class="label">Redis</div>
						<div class="value _monospace">{{ serverInfo.redis }}</div>
					</div>
					<div class="number _panel">
						<div class="label">Vue</div>
						<div class="value _monospace">{{ vueVersion }}</div>
					</div>
				</div>
			</div>
		</div>
		<div class="right">
			<div class="container charts">
				<div class="title">Active users</div>
				<div class="body">
					<canvas ref="chartEl"></canvas>
				</div>
			</div>
			<div class="container federation">
				<div class="title">Active instances</div>
				<div class="body">
					<XFederation/>
				</div>
			</div>
			<div v-if="stats" class="container federationStats">
				<div class="title">Federation</div>
				<div class="body">
					<div class="number _panel">
						<div class="label">Sub</div>
						<div class="value _monospace">
							{{ number(federationSubActive) }}
							<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="federationSubActiveDiff"><template #before>(</template><template #after>)</template></MkNumberDiff>
						</div>
					</div>
					<div class="number _panel">
						<div class="label">Pub</div>
						<div class="value _monospace">
							{{ number(federationPubActive) }}
							<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="federationPubActiveDiff"><template #before>(</template><template #after>)</template></MkNumberDiff>
						</div>
					</div>
				</div>
			</div>
			<div class="container tagCloud">
				<div class="body">
					<MkTagCloud v-if="activeInstances">
						<li v-for="instance in activeInstances">
							<a @click.prevent="onInstanceClick(instance)">
								<img style="width: 32px;" :src="instance.iconUrl">
							</a>
						</li>
					</MkTagCloud>
				</div>
			</div>
			<div v-if="topSubInstancesForPie && topPubInstancesForPie" class="container federationPies">
				<div class="body">
					<div class="chart deliver">
						<div class="title">Sub</div>
						<XPie :data="topSubInstancesForPie"/>
						<div class="subTitle">Top 10</div>
					</div>
					<div class="chart inbox">
						<div class="title">Pub</div>
						<XPie :data="topPubInstancesForPie"/>
						<div class="subTitle">Top 10</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { markRaw, version as vueVersion, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
import { enUS } from 'date-fns/locale';
import tinycolor from 'tinycolor2';
import MagicGrid from 'magic-grid';
import XMetrics from './metrics.vue';
import XFederation from './overview.federation.vue';
import XQueueChart from './overview.queue-chart.vue';
import XUser from './overview.user.vue';
import XPie from './overview.pie.vue';
import MkNumberDiff from '@/components/MkNumberDiff.vue';
import MkTagCloud from '@/components/MkTagCloud.vue';
import { version, url } from '@/config';
import number from '@/filters/number';
import * as os from '@/os';
import { stream } from '@/stream';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import 'chartjs-adapter-date-fns';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import MkFileListForAdmin from '@/components/MkFileListForAdmin.vue';

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
	//gradient,
);

const rootEl = $ref<HTMLElement>();
const chartEl = $ref<HTMLCanvasElement>(null);
let stats: any = $ref(null);
let serverInfo: any = $ref(null);
let topSubInstancesForPie: any = $ref(null);
let topPubInstancesForPie: any = $ref(null);
let usersComparedToThePrevDay: any = $ref(null);
let notesComparedToThePrevDay: any = $ref(null);
let federationPubActive = $ref<number | null>(null);
let federationPubActiveDiff = $ref<number | null>(null);
let federationSubActive = $ref<number | null>(null);
let federationSubActiveDiff = $ref<number | null>(null);
let newUsers = $ref(null);
let activeInstances = $shallowRef(null);
const queueStatsConnection = markRaw(stream.useChannel('queueStats'));
const now = new Date();
let chartInstance: Chart = null;
const chartLimit = 30;
const filesPagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 9,
	noPaging: true,
};

const { handler: externalTooltipHandler } = useChartTooltip();

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr) => {
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: v,
		}));
	};

	const raw = await os.api('charts/active-users', { limit: chartLimit, span: 'day' });

	const gridColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	const color = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--accent'));

	chartInstance = new Chart(chartEl, {
		type: 'bar',
		data: {
			//labels: new Array(props.limit).fill(0).map((_, i) => getDate(i).toLocaleString()).slice().reverse(),
			datasets: [{
				parsing: false,
				label: 'a',
				data: format(raw.readWrite).slice().reverse(),
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 3,
				backgroundColor: color,
				/*gradient: props.bar ? undefined : {
					backgroundColor: {
						axis: 'y',
						colors: {
							0: alpha(x.color ? x.color : getColor(i), 0),
							[maxes[i]]: alpha(x.color ? x.color : getColor(i), 0.2),
						},
					},
				},*/
				barPercentage: 0.9,
				categoryPercentage: 0.9,
				clip: 8,
			}],
		},
		options: {
			aspectRatio: 2.5,
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					type: 'time',
					display: false,
					stacked: true,
					offset: false,
					time: {
						stepSize: 1,
						unit: 'month',
					},
					grid: {
						display: false,
					},
					ticks: {
						display: false,
					},
					adapters: {
						date: {
							locale: enUS,
						},
					},
					min: getDate(chartLimit).getTime(),
				},
				y: {
					display: false,
					position: 'left',
					stacked: true,
					grid: {
						display: false,
					},
					ticks: {
						display: false,
						//mirror: true,
					},
				},
			},
			interaction: {
				intersect: false,
				mode: 'index',
			},
			elements: {
				point: {
					hoverRadius: 5,
					hoverBorderWidth: 2,
				},
			},
			animation: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
				//gradient,
			},
		},
		plugins: [{
			id: 'vLine',
			beforeDraw(chart, args, options) {
				if (chart.tooltip?._active?.length) {
					const activePoint = chart.tooltip._active[0];
					const ctx = chart.ctx;
					const x = activePoint.element.x;
					const topY = chart.scales.y.top;
					const bottomY = chart.scales.y.bottom;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, bottomY);
					ctx.lineTo(x, topY);
					ctx.lineWidth = 1;
					ctx.strokeStyle = vLineColor;
					ctx.stroke();
					ctx.restore();
				}
			},
		}],
	});
}

function onInstanceClick(i) {
	os.pageWindow(`/instance-info/${i.host}`);
}

onMounted(async () => {
	/*
	const magicGrid = new MagicGrid({
		container: rootEl,
		static: true,
		animate: true,
	});

	magicGrid.listen();
	*/

	renderChart();

	os.api('stats', {}).then(statsResponse => {
		stats = statsResponse;

		os.apiGet('charts/users', { limit: 2, span: 'day' }).then(chart => {
			usersComparedToThePrevDay = stats.originalUsersCount - chart.local.total[1];
		});

		os.apiGet('charts/notes', { limit: 2, span: 'day' }).then(chart => {
			notesComparedToThePrevDay = stats.originalNotesCount - chart.local.total[1];
		});
	});

	os.apiGet('charts/federation', { limit: 2, span: 'day' }).then(chart => {
		federationPubActive = chart.pubActive[0];
		federationPubActiveDiff = chart.pubActive[0] - chart.pubActive[1];
		federationSubActive = chart.subActive[0];
		federationSubActiveDiff = chart.subActive[0] - chart.subActive[1];
	});

	os.apiGet('federation/stats', { limit: 10 }).then(res => {
		topSubInstancesForPie = res.topSubInstances.map(x => ({
			name: x.host,
			color: x.themeColor,
			value: x.followersCount,
			onClick: () => {
				os.pageWindow(`/instance-info/${x.host}`);
			},
		})).concat([{ name: '(other)', color: '#80808080', value: res.otherFollowersCount }]);
		topPubInstancesForPie = res.topPubInstances.map(x => ({
			name: x.host,
			color: x.themeColor,
			value: x.followingCount,
			onClick: () => {
				os.pageWindow(`/instance-info/${x.host}`);
			},
		})).concat([{ name: '(other)', color: '#80808080', value: res.otherFollowingCount }]);
	});

	os.api('admin/server-info').then(serverInfoResponse => {
		serverInfo = serverInfoResponse;
	});

	os.api('admin/show-users', {
		limit: 5,
		sort: '+createdAt',
	}).then(res => {
		newUsers = res;
	});

	os.api('federation/instances', {
		sort: '+lastCommunicatedAt',
		limit: 25,
	}).then(res => {
		activeInstances = res;
	});

	nextTick(() => {
		queueStatsConnection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 100,
		});
	});
});

onBeforeUnmount(() => {
	queueStatsConnection.dispose();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.dashboard,
	icon: 'fas fa-tachometer-alt',
});
</script>

<style lang="scss" scoped>
.edbbcaef {
	display: flex;

	> .left, > .right {
		box-sizing: border-box;
		width: 50%;

		> .container {
			margin: 32px 0;

			> .title {
				font-weight: bold;
				margin-bottom: 16px;
			}

			&.stats, &.federationStats {
				> .body {
					display: grid;
					grid-gap: 16px;
					grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

					> .number {
						padding: 14px 20px;

						> .label {
							opacity: 0.7;
							font-size: 0.8em;
						}

						> .value {
							font-weight: bold;
							font-size: 1.5em;

							> .diff {
								font-size: 0.7em;
							}
						}
					}
				}
			}

			&.env {
				> .body {
					display: grid;
					grid-gap: 16px;
					grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

					> .number {
						padding: 14px 20px;

						> .label {
							opacity: 0.7;
							font-size: 0.8em;
						}

						> .value {
							font-size: 1.1em;
						}
					}
				}
			}

			&.charts {
				> .body {
					padding: 32px;
					background: var(--panel);
					border-radius: var(--radius);
				}
			}

			&.users {
				> .body {
					background: var(--panel);
					border-radius: var(--radius);

					> .user {
						padding: 16px 20px;

						&:not(:last-child) {
							border-bottom: solid 0.5px var(--divider);
						}
					}
				}
			}

			&.federation {
				> .body {
					background: var(--panel);
					border-radius: var(--radius);
					overflow: clip;
				}
			}

			&.queue {
				> .body {
					display: grid;
					grid-gap: 16px;
					grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

					> .chart {
						position: relative;
						padding: 20px;
						background: var(--panel);
						border-radius: var(--radius);

						> .title {
							position: absolute;
							top: 20px;
							left: 20px;
							font-size: 90%;
						}
					}
				}
			}

			&.federationPies {
				> .body {
					display: grid;
					grid-gap: 16px;
					grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

					> .chart {
						position: relative;
						padding: 20px;
						background: var(--panel);
						border-radius: var(--radius);

						> .title {
							position: absolute;
							top: 20px;
							left: 20px;
							font-size: 90%;
						}

						> .subTitle {
							position: absolute;
							bottom: 20px;
							right: 20px;
							font-size: 85%;
						}
					}
				}
			}

			&.tagCloud {
				> .body {
					background: var(--panel);
					border-radius: var(--radius);
					overflow: clip;
				}
			}
		}
	}

	> .left {
		padding-right: 16px;
	}

	> .right {
		padding-left: 16px;
	}
}
</style>
