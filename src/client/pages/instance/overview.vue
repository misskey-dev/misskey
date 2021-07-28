<template>
<FormBase>
	<FormSuspense :p="init">
		<FormInfo v-if="noMaintainerInformation" warn>{{ $ts.noMaintainerInformationWarning }} <MkA to="/instance/settings" class="_link">{{ $ts.configure }}</MkA></FormInfo>
		<FormInfo v-if="noBotProtection" warn>{{ $ts.noBotProtectionWarning }} <MkA to="/instance/bot-protection" class="_link">{{ $ts.configure }}</MkA></FormInfo>

		<FormSuspense :p="fetchStats" v-slot="{ result: stats }">
			<FormGroup>
				<FormKeyValueView>
					<template #key>Users</template>
					<template #value>{{ number(stats.originalUsersCount) }}</template>
				</FormKeyValueView>
				<FormKeyValueView>
					<template #key>Notes</template>
					<template #value>{{ number(stats.originalNotesCount) }}</template>
				</FormKeyValueView>
			</FormGroup>
		</FormSuspense>
	
		<div class="_formItem">
			<div class="_formPanel">
				<MkInstanceStats :chart-limit="300" :detailed="true"/>
			</div>
		</div>

		<XMetrics/>

		<FormSuspense :p="fetchServerInfo" v-slot="{ result: serverInfo }">
			<FormGroup>
				<FormKeyValueView>
					<template #key>Node.js</template>
					<template #value>{{ serverInfo.node }}</template>
				</FormKeyValueView>
				<FormKeyValueView>
					<template #key>PostgreSQL</template>
					<template #value>{{ serverInfo.psql }}</template>
				</FormKeyValueView>
				<FormKeyValueView>
					<template #key>Redis</template>
					<template #value>{{ serverInfo.redis }}</template>
				</FormKeyValueView>
			</FormGroup>
		</FormSuspense>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from 'vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
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
import XMetrics from './metrics.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormSuspense,
		FormGroup,
		FormInfo,
		FormKeyValueView,
		MkInstanceStats,
		XMetrics,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.overview,
				icon: 'fas fa-tachometer-alt'
			},
			page: 'index',
			version,
			url,
			stats: null,
			meta: null,
			fetchStats: () => os.api('stats', {}),
			fetchServerInfo: () => os.api('admin/server-info', {}),
			fetchJobs: () => os.api('admin/queue/deliver-delayed', {}),
			fetchModLogs: () => os.api('admin/show-moderation-logs', {}),
			noMaintainerInformation: false,
			noBotProtection: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			this.meta = await os.api('meta', { detail: true });

			const isEmpty = (x: any) => x == null || x == '';

			this.noMaintainerInformation = isEmpty(this.meta.maintainerName) || isEmpty(this.meta.maintainerEmail);
			this.noBotProtection = !this.meta.enableHcaptcha && !this.meta.enableRecaptcha;
		},
	
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

		bytes,

		number,
	}
});
</script>
