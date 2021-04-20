<template>
<div v-if="meta" v-show="page === 'index'" class="xhexznfu _section">
	<MkFolder>
		<template #header><i class="fas fa-tachometer-alt"></i> {{ $ts.overview }}</template>

		<div class="sboqnrfi" :style="{ gridTemplateRows: overviewHeight }">
			<MkInstanceStats :chart-limit="300" :detailed="true" class="_gap" ref="stats"/>

			<MkContainer :foldable="true" class="_gap">
				<template #header><i class="fas fa-info-circle"></i>{{ $ts.instanceInfo }}</template>

				<div class="_content">
					<div class="_keyValue"><b>Misskey</b><span>v{{ version }}</span></div>
				</div>
				<div class="_content" v-if="serverInfo">
					<div class="_keyValue"><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
					<div class="_keyValue"><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
					<div class="_keyValue"><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
				</div>
			</MkContainer>
			
			<MkContainer :foldable="true" :scrollable="true" class="_gap" style="height: 300px;">
				<template #header><i class="fas fa-database"></i>{{ $ts.database }}</template>

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
			</MkContainer>
		</div>
	</MkFolder>
</div>
<div v-if="page === 'logs'" class="_section">
	<MkFolder>
		<template #header><i class="fas fa-stream"></i> {{ $ts.logs }}</template>

		<div class="_keyValue" v-for="log in modLogs">
			<b>{{ log.type }}</b><span>by {{ log.user.username }}</span><MkTime :time="log.createdAt" style="opacity: 0.7;"/>
		</div>
	</MkFolder>
</div>
<div v-if="page === 'metrics'">
	<XMetrics/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from 'vue';
import { faPlay, faPause, faDatabase, faServer, faExchangeAlt, faMicrochip, faHdd, faStream, faTrashAlt, faInfoCircle, faExclamationTriangle, faTachometerAlt, faHeartbeat, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import VueJsonPretty from 'vue-json-pretty';
import MkInstanceStats from '@client/components/instance-stats.vue';
import MkButton from '@client/components/ui/button.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkInput from '@client/components/ui/input.vue';
import MkContainer from '@client/components/ui/container.vue';
import MkFolder from '@client/components/ui/folder.vue';
import { version, url } from '@client/config';
import bytes from '../../filters/bytes';
import number from '../../filters/number';
import MkInstanceInfo from './instance.vue';
import XMetrics from './index.metrics.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkInstanceStats,
		MkButton,
		MkSelect,
		MkInput,
		MkContainer,
		MkFolder,
		XMetrics,
		VueJsonPretty,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				tabs: [{
					id: 'index',
					title: null,
					tooltip: this.$ts.instance,
					icon: 'fas fa-server',
					onClick: () => { this.page = 'index'; },
					selected: computed(() => this.page === 'index')
				}, {
					id: 'metrics',
					title: null,
					tooltip: this.$ts.metrics,
					icon: 'fas fa-heartbeat',
					onClick: () => { this.page = 'metrics'; },
					selected: computed(() => this.page === 'metrics')
				}, {
					id: 'logs',
					title: null,
					tooltip: this.$ts.logs,
					icon: 'fas fa-stream',
					onClick: () => { this.page = 'logs'; },
					selected: computed(() => this.page === 'logs')
				}]
			},
			page: 'index',
			version,
			url,
			stats: null,
			serverInfo: null,
			modLogs: [],
			dbInfo: null,
			faPlay, faPause, faDatabase, faServer, faExchangeAlt, faMicrochip, faHdd, faStream, faTrashAlt, faInfoCircle, faExclamationTriangle, faTachometerAlt, faHeartbeat, faClipboardList,
		}
	},

	computed: {
		meta() {
			return this.$instance;
		},
	},

	mounted() {
		this.fetchJobs();
		this.fetchModLogs();

		os.api('admin/server-info', {}).then(res => {
			this.serverInfo = res;
		});

		os.api('admin/get-table-stats', {}).then(res => {
			this.dbInfo = Object.entries(res).sort((a, b) => b[1].size - a[1].size);
		});
	},

	methods: {
		async showInstanceInfo(q) {
			let instance = q;
			if (typeof q === 'string') {
				instance = await os.api('federation/show-instance', {
					host: q
				});
			}
			os.popup(MkInstanceInfo, {
				instance: instance
			}, {}, 'closed');
		},

		fetchJobs() {
			os.api('admin/queue/deliver-delayed', {}).then(jobs => {
				this.jobs = jobs;
			});
		},

		fetchModLogs() {
			os.api('admin/show-moderation-logs', {}).then(logs => {
				this.modLogs = logs;
			});
		},

		bytes,

		number,
	}
});
</script>
