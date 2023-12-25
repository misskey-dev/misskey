<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="instance" :contentMax="600" :marginMin="16" :marginMax="32">
		<div v-if="tab === 'overview'" class="_gaps_m">
			<div class="fnfelxur">
				<img :src="faviconUrl" alt="" class="icon"/>
				<span class="name">{{ instance.name || `(${i18n.ts.unknown})` }}</span>
			</div>
			<div style="display: flex; flex-direction: column; gap: 1em;">
				<MkKeyValue :copy="host" oneline>
					<template #key>Host</template>
					<template #value><span class="_monospace"><MkLink :url="`https://${host}`">{{ host }}</MkLink></span></template>
				</MkKeyValue>
				<MkKeyValue oneline>
					<template #key>{{ i18n.ts.software }}</template>
					<template #value><span class="_monospace">{{ instance.softwareName || `(${i18n.ts.unknown})` }} / {{ instance.softwareVersion || `(${i18n.ts.unknown})` }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline>
					<template #key>{{ i18n.ts.administrator }}</template>
					<template #value>{{ instance.maintainerName || `(${i18n.ts.unknown})` }} ({{ instance.maintainerEmail || `(${i18n.ts.unknown})` }})</template>
				</MkKeyValue>
			</div>
			<MkKeyValue>
				<template #key>{{ i18n.ts.description }}</template>
				<template #value>{{ instance.description }}</template>
			</MkKeyValue>

			<FormSection v-if="iAmModerator">
				<template #label>Moderation</template>
				<div class="_gaps_s">
					<MkSwitch v-model="suspended" :disabled="!instance" @update:modelValue="toggleSuspend">{{ i18n.ts.stopActivityDelivery }}</MkSwitch>
					<MkSwitch v-model="isBlocked" :disabled="!meta || !instance" @update:modelValue="toggleBlock">{{ i18n.ts.blockThisInstance }}</MkSwitch>
					<MkSwitch v-model="isSilenced" :disabled="!meta || !instance" @update:modelValue="toggleSilenced">{{ i18n.ts.silenceThisInstance }}</MkSwitch>
					<MkButton @click="refreshMetadata"><i class="ti ti-refresh"></i> Refresh metadata</MkButton>
				</div>
			</FormSection>

			<FormSection>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ i18n.ts.registeredAt }}</template>
					<template #value><MkTime mode="detail" :time="instance.firstRetrievedAt"/></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ i18n.ts.updatedAt }}</template>
					<template #value><MkTime mode="detail" :time="instance.infoUpdatedAt"/></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ i18n.ts.latestRequestReceivedAt }}</template>
					<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
				</MkKeyValue>
			</FormSection>

			<FormSection>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Following (Pub)</template>
					<template #value>{{ number(instance.followingCount) }}</template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Followers (Sub)</template>
					<template #value>{{ number(instance.followersCount) }}</template>
				</MkKeyValue>
			</FormSection>

			<FormSection>
				<template #label>Well-known resources</template>
				<FormLink :to="`https://${host}/.well-known/host-meta`" external style="margin-bottom: 8px;">host-meta</FormLink>
				<FormLink :to="`https://${host}/.well-known/host-meta.json`" external style="margin-bottom: 8px;">host-meta.json</FormLink>
				<FormLink :to="`https://${host}/.well-known/nodeinfo`" external style="margin-bottom: 8px;">nodeinfo</FormLink>
				<FormLink :to="`https://${host}/robots.txt`" external style="margin-bottom: 8px;">robots.txt</FormLink>
				<FormLink :to="`https://${host}/manifest.json`" external style="margin-bottom: 8px;">manifest.json</FormLink>
			</FormSection>
		</div>
		<div v-else-if="tab === 'chart'" class="_gaps_m">
			<div class="cmhjzshl">
				<div class="selects">
					<MkSelect v-model="chartSrc" style="margin: 0 10px 0 0; flex: 1;">
						<option value="instance-requests">{{ i18n.ts._instanceCharts.requests }}</option>
						<option value="instance-users">{{ i18n.ts._instanceCharts.users }}</option>
						<option value="instance-users-total">{{ i18n.ts._instanceCharts.usersTotal }}</option>
						<option value="instance-notes">{{ i18n.ts._instanceCharts.notes }}</option>
						<option value="instance-notes-total">{{ i18n.ts._instanceCharts.notesTotal }}</option>
						<option value="instance-ff">{{ i18n.ts._instanceCharts.ff }}</option>
						<option value="instance-ff-total">{{ i18n.ts._instanceCharts.ffTotal }}</option>
						<option value="instance-drive-usage">{{ i18n.ts._instanceCharts.cacheSize }}</option>
						<option value="instance-drive-usage-total">{{ i18n.ts._instanceCharts.cacheSizeTotal }}</option>
						<option value="instance-drive-files">{{ i18n.ts._instanceCharts.files }}</option>
						<option value="instance-drive-files-total">{{ i18n.ts._instanceCharts.filesTotal }}</option>
					</MkSelect>
				</div>
				<div class="charts">
					<div class="label">{{ i18n.t('recentNHours', { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
					<div class="label">{{ i18n.t('recentNDays', { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
				</div>
			</div>
		</div>
		<div v-else-if="tab === 'users'" class="_gaps_m">
			<MkPagination v-slot="{items}" :pagination="usersPagination" style="display: grid; grid-template-columns: repeat(auto-fill,minmax(270px,1fr)); grid-gap: 12px;">
				<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${dateString(user.updatedAt)}`" class="user" :to="`/admin/user/${user.id}`">
					<MkUserCardMini :user="user"/>
				</MkA>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView tall :value="instance">
			</MkObjectView>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkChart from '@/components/MkChart.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import number from '@/filters/number.js';
import { iAmModerator, iAmAdmin } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkPagination from '@/components/MkPagination.vue';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
import { dateString } from '@/filters/date.js';

const props = defineProps<{
	host: string;
}>();

const tab = ref('overview');
const chartSrc = ref('instance-requests');
const meta = ref<Misskey.entities.AdminMetaResponse | null>(null);
const instance = ref<Misskey.entities.FederationInstance | null>(null);
const suspended = ref(false);
const isBlocked = ref(false);
const isSilenced = ref(false);
const faviconUrl = ref<string | null>(null);

const usersPagination = {
	endpoint: iAmModerator ? 'admin/show-users' : 'users' as const,
	limit: 10,
	params: {
		sort: '+updatedAt',
		state: 'all',
		hostname: props.host,
	},
	offsetMode: true,
};

async function fetch(): Promise<void> {
	if (iAmAdmin) {
		meta.value = await os.api('admin/meta');
	}
	instance.value = await os.api('federation/show-instance', {
		host: props.host,
	});
	suspended.value = instance.value?.isSuspended ?? false;
	isBlocked.value = instance.value?.isBlocked ?? false;
	isSilenced.value = instance.value?.isSilenced ?? false;
	faviconUrl.value = getProxiedImageUrlNullable(instance.value?.faviconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.value?.iconUrl, 'preview');
}

async function toggleBlock(): Promise<void> {
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	await os.api('admin/update-meta', {
		blockedHosts: isBlocked.value ? meta.value.blockedHosts.concat([host]) : meta.value.blockedHosts.filter(x => x !== host),
	});
}

async function toggleSilenced(): Promise<void> {
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	const silencedHosts = meta.value.silencedHosts ?? [];
	await os.api('admin/update-meta', {
		silencedHosts: isSilenced.value ? silencedHosts.concat([host]) : silencedHosts.filter(x => x !== host),
	});
}

async function toggleSuspend(): Promise<void> {
	if (!instance.value) throw new Error('No instance?');
	await os.api('admin/federation/update-instance', {
		host: instance.value.host,
		isSuspended: suspended.value,
	});
}

function refreshMetadata(): void {
	if (!instance.value) throw new Error('No instance?');
	os.api('admin/federation/refresh-remote-instance-metadata', {
		host: instance.value.host,
	});
	os.alert({
		text: 'Refresh requested',
	});
}

fetch();

const headerActions = computed(() => [{
	text: `https://${props.host}`,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(`https://${props.host}`, '_blank', 'noopener');
	},
}]);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'chart',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'users',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}]);

definePageMetadata({
	title: props.host,
	icon: 'ti ti-server',
});
</script>

<style lang="scss" scoped>
.fnfelxur {
	display: flex;
	align-items: center;

	> .icon {
		display: block;
		margin: 0 16px 0 0;
		height: 64px;
		border-radius: 8px;
	}

	> .name {
		word-break: break-all;
	}
}

.cmhjzshl {
	> .selects {
		display: flex;
		margin: 0 0 16px 0;
	}

	> .charts {
		> .label {
			margin-bottom: 12px;
			font-weight: bold;
		}
	}
}
</style>
