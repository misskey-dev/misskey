<template>
<div>
	<ui-card>
		<template #title><fa :icon="faChartBar"/> {{ $t('title') }}</template>
		<section class="wptihjuy">
			<header><fa :icon="faPaperPlane"/> Deliver</header>
			<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="deliver"/>
		</section>
		<section class="wptihjuy">
			<header><fa :icon="faInbox"/> Inbox</header>
			<x-chart v-if="connection" :connection="connection" :limit="chartLimit" type="inbox"/>
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
				</ui-select>
				<ui-select v-model="state">
					<template #label>{{ $t('state') }}</template>
					<option value="delayed">{{ $t('states.delayed') }}</option>
				</ui-select>
			</ui-horizon-group>
			<sequential-entrance animation="entranceFromTop" delay="25">
				<div class="xvvuvgsv" v-for="job in jobs">
					<b>{{ job.id }}</b>
					<template v-if="domain === 'deliver'">
						<span>{{ job.data.to }}</span>
					</template>
					<template v-if="domain === 'inbox'">
						<span>{{ job.activity.id }}</span>
					</template>
				</div>
			</sequential-entrance>
			<ui-info v-if="jobs.length == jobsLimit">{{ $t('result-is-truncated', { n: jobsLimit }) }}</ui-info>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTasks, faInbox } from '@fortawesome/free-solid-svg-icons';
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
			domain: 'deliver',
			state: 'delayed',
			faTasks, faPaperPlane, faInbox, faChartBar
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
				this.jobs = jobs;
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.xvvuvgsv
	> b
		margin-right 16px

</style>
