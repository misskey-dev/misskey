<template>
<FormBase>
	<FormSuspense :p="init">
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
	
		<div class="_debobigegoItem">
			<div class="_debobigegoPanel">
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
import FormKeyValueView from '@client/components/debobigego/key-value-view.vue';
import FormInput from '@client/components/debobigego/input.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormTextarea from '@client/components/debobigego/textarea.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import FormSuspense from '@client/components/debobigego/suspense.vue';
import MkInstanceStats from '@client/components/instance-stats.vue';
import MkButton from '@client/components/ui/button.vue';
import MkSelect from '@client/components/form/select.vue';
import MkInput from '@client/components/form/input.vue';
import MkContainer from '@client/components/ui/container.vue';
import MkFolder from '@client/components/ui/folder.vue';
import { version, url } from '@client/config';
import bytes from '@client/filters/bytes';
import number from '@client/filters/number';
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
				icon: 'fas fa-tachometer-alt',
				bg: 'var(--bg)',
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
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			this.meta = await os.api('meta', { detail: true });
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
