<template>
<div>
	<ui-card>
		<template #title><fa :icon="faChartBar"/> {{ $t('title') }}</template>
		<section>
			<header><fa :icon="faPaperPlane"/> {{ $t('domains.deliver') }}</header>
			<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="deliver"/>
		</section>
		<section>
			<header><fa :icon="faInbox"/> {{ $t('domains.inbox') }}</header>
			<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="inbox"/>
		</section>
		<section>
			<details>
				<summary>{{ $t('other-queues') }}</summary>
				<section>
					<header><fa :icon="faDatabase"/> {{ $t('domains.db') }}</header>
					<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="db"/>
				</section>
				<ui-hr/>
				<section>
					<header><fa :icon="faCloud"/> {{ $t('domains.objectStorage') }}</header>
					<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="objectStorage"/>
				</section>
			</details>
		</section>
		<section>
			<ui-button @click="removeAllJobs">{{ $t('remove-all-jobs') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faTasks"/> {{ $t('jobs') }}</template>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-select v-model="domain">
					<template #label>{{ $t('queue') }}</template>
					<option value="deliver">{{ $t('domains.deliver') }}</option>
					<option value="inbox">{{ $t('domains.inbox') }}</option>
					<option value="db">{{ $t('domains.db') }}</option>
					<option value="objectStorage">{{ $t('domains.objectStorage') }}</option>
				</ui-select>
				<ui-select v-model="state">
					<template #label>{{ $t('state') }}</template>
					<option value="active">{{ $t('states.active') }}</option>
					<option value="waiting">{{ $t('states.waiting') }}</option>
					<option value="delayed">{{ $t('states.delayed') }}</option>
				</ui-select>
			</ui-horizon-group>
			<sequential-entrance animation="entranceFromTop" delay="25">
				<div class="xvvuvgsv" v-for="job in jobs" :key="job.id">
					<b>{{ job.id }}</b>
					<template v-if="domain === 'deliver'">
						<span>{{ job.data.to }}</span>
					</template>
					<template v-if="domain === 'inbox'">
						<span>{{ job.data.activity.id }}</span>
					</template>
					<span>{{ `(${job.attempts}/${job.maxAttempts}, ${Math.floor((jobsFetched - job.timestamp) / 1000 / 60)}min)` }}</span>
				</div>
			</sequential-entrance>
			<ui-info v-if="jobs.length == jobsLimit">{{ $t('result-is-truncated', { n: jobsLimit }) }}</ui-info>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTasks, faInbox, faDatabase, faCloud } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane, faChartBar } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../i18n';
import XChart from './queue.chart.vue';

export default Vue.extend({
	i18n: i18n('admin/views/queue.vue'),

	components: {
		XChart
	},

	data() {
		return {
			connection: null,
			chartLimit: 200,
			jobs: [],
			jobsLimit: 50,
			jobsFetched: Date.now(),
			domain: 'deliver',
			state: 'delayed',
			faTasks, faPaperPlane, faInbox, faChartBar, faDatabase, faCloud
		};
	},

	watch: {
		domain() {
			this.jobs = [];
			this.fetchJobs();
		},

		state() {
			this.jobs = [];
			this.fetchJobs();
		},
	},

	mounted() {
		this.fetchJobs();

		this.connection = this.$root.stream.useSharedConnection('queueStats');
		this.connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: this.chartLimit
		});

		this.$once('hook:beforeDestroy', () => {
			this.connection.dispose();
		});
	},

	methods: {
		async removeAllJobs() {
			const process = async () => {
				await this.$root.api('admin/queue/clear');
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});
		},

		fetchJobs() {
			this.$root.api('admin/queue/jobs', {
				domain: this.domain,
				state: this.state,
				limit: this.jobsLimit
			}).then(jobs => {
				this.jobsFetched = Date.now(),
				this.jobs = jobs;
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.xvvuvgsv
	margin-left -6px
	> b, span
		margin 0 6px

</style>
