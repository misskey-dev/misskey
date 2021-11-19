<template>
<FormBase>
	<FormGroup v-if="instance">
		<template #label>{{ instance.host }}</template>
		<FormGroup>
			<div class="_debobigegoItem">
				<div class="_debobigegoPanel fnfelxur">
					<img :src="instance.iconUrl || instance.faviconUrl" alt="" class="icon"/>
				</div>
			</div>
			<FormKeyValueView>
				<template #key>Name</template>
				<template #value><span class="_monospace">{{ instance.name || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormButton v-if="$i.isAdmin || $i.isModerator" primary @click="info">{{ $ts.settings }}</FormButton>

		<FormTextarea readonly :value="instance.description">
			<span>{{ $ts.description }}</span>
		</FormTextarea>

		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.software }}</template>
				<template #value><span class="_monospace">{{ instance.softwareName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.version }}</template>
				<template #value><span class="_monospace">{{ instance.softwareVersion || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.administrator }}</template>
				<template #value><span class="_monospace">{{ instance.maintainerName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.contact }}</template>
				<template #value><span class="_monospace">{{ instance.maintainerEmail || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestSentAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestStatus }}</template>
				<template #value>{{ instance.latestStatus ? instance.latestStatus : 'N/A' }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestReceivedAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>Open Registrations</template>
				<template #value>{{ instance.openRegistrations ? $ts.yes : $ts.no }}</template>
			</FormKeyValueView>
		</FormGroup>
		<div class="_debobigegoItem">
			<div class="_debobigegoLabel">{{ $ts.statistics }}</div>
			<div class="_debobigegoPanel cmhjzshl">
				<div class="selects">
					<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
						<option value="instance-requests">{{ $ts._instanceCharts.requests }}</option>
						<option value="instance-users">{{ $ts._instanceCharts.users }}</option>
						<option value="instance-users-total">{{ $ts._instanceCharts.usersTotal }}</option>
						<option value="instance-notes">{{ $ts._instanceCharts.notes }}</option>
						<option value="instance-notes-total">{{ $ts._instanceCharts.notesTotal }}</option>
						<option value="instance-ff">{{ $ts._instanceCharts.ff }}</option>
						<option value="instance-ff-total">{{ $ts._instanceCharts.ffTotal }}</option>
						<option value="instance-drive-usage">{{ $ts._instanceCharts.cacheSize }}</option>
						<option value="instance-drive-usage-total">{{ $ts._instanceCharts.cacheSizeTotal }}</option>
						<option value="instance-drive-files">{{ $ts._instanceCharts.files }}</option>
						<option value="instance-drive-files-total">{{ $ts._instanceCharts.filesTotal }}</option>
					</MkSelect>
					<MkSelect v-model="chartSpan" style="margin: 0;">
						<option value="hour">{{ $ts.perHour }}</option>
						<option value="day">{{ $ts.perDay }}</option>
					</MkSelect>
				</div>
				<div class="chart">
					<MkChart :src="chartSrc" :span="chartSpan" :limit="90" :detailed="true"></MkChart>
				</div>
			</div>
		</div>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.registeredAt }}</template>
				<template #value><MkTime mode="detail" :time="instance.caughtAt"/></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.updatedAt }}</template>
				<template #value><MkTime mode="detail" :time="instance.infoUpdatedAt"/></template>
			</FormKeyValueView>
		</FormGroup>
		<FormObjectView tall :value="instance">
			<span>Raw</span>
		</FormObjectView>
		<FormGroup>
			<template #label>Well-known resources</template>
			<FormLink :to="`https://${host}/.well-known/host-meta`" external>host-meta</FormLink>
			<FormLink :to="`https://${host}/.well-known/host-meta.json`" external>host-meta.json</FormLink>
			<FormLink :to="`https://${host}/.well-known/nodeinfo`" external>nodeinfo</FormLink>
			<FormLink :to="`https://${host}/robots.txt`" external>robots.txt</FormLink>
			<FormLink :to="`https://${host}/manifest.json`" external>manifest.json</FormLink>
		</FormGroup>
		<FormSuspense v-slot="{ result: dns }" :p="dnsPromiseFactory">
			<FormGroup>
				<template #label>DNS</template>
				<FormKeyValueView v-for="record in dns.a" :key="record">
					<template #key>A</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.aaaa" :key="record">
					<template #key>AAAA</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.cname" :key="record">
					<template #key>CNAME</template>
					<template #value><span class="_monospace">{{ record }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView v-for="record in dns.txt">
					<template #key>TXT</template>
					<template #value><span class="_monospace">{{ record[0] }}</span></template>
				</FormKeyValueView>
			</FormGroup>
		</FormSuspense>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import MkChart from '@/components/chart.vue';
import FormObjectView from '@/components/debobigego/object-view.vue';
import FormTextarea from '@/components/debobigego/textarea.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import MkSelect from '@/components/form/select.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';
import MkInstanceInfo from '@/pages/admin/instance.vue';

export default defineComponent({
	components: {
		FormBase,
		FormTextarea,
		FormObjectView,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		FormSuspense,
		MkSelect,
		MkChart,
	},

	props: {
		host: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceInfo,
				icon: 'fas fa-info-circle',
				actions: [{
					text: `https://${this.host}`,
					icon: 'fas fa-external-link-alt',
					handler: () => {
						window.open(`https://${this.host}`, '_blank');
					}
				}],
			},
			instance: null,
			dnsPromiseFactory: () => os.api('federation/dns', {
				host: this.host
			}),
			chartSrc: 'instance-requests',
			chartSpan: 'hour',
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		number,
		bytes,

		async fetch() {
			this.instance = await os.api('federation/show-instance', {
				host: this.host
			});
		},

		info() {
			os.popup(MkInstanceInfo, {
				instance: this.instance
			}, {}, 'closed');
		}
	}
});
</script>

<style lang="scss" scoped>
.fnfelxur {
	padding: 16px;

	> .icon {
		display: block;
		margin: auto;
		height: 64px;
		border-radius: 8px;
	}
}

.cmhjzshl {
	> .selects {
		display: flex;
		padding: 16px;
	}
}
</style>
