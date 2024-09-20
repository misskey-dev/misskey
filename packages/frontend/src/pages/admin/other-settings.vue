<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div class="_gaps">
				<div class="_panel" style="padding: 16px;">
					<MkSwitch v-model="enableServerMachineStats">
						<template #label>{{ i18n.ts.enableServerMachineStats }}</template>
						<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
					</MkSwitch>
				</div>

				<div class="_panel" style="padding: 16px;">
					<MkSwitch v-model="enableIdenticonGeneration">
						<template #label>{{ i18n.ts.enableIdenticonGeneration }}</template>
						<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
					</MkSwitch>
				</div>

				<div class="_panel" style="padding: 16px;">
					<MkSwitch v-model="enableChartsForRemoteUser">
						<template #label>{{ i18n.ts.enableChartsForRemoteUser }}</template>
						<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
					</MkSwitch>
				</div>

				<div class="_panel" style="padding: 16px;">
					<MkSwitch v-model="enableChartsForFederatedInstances">
						<template #label>{{ i18n.ts.enableChartsForFederatedInstances }}</template>
						<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
					</MkSwitch>
				</div>

				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-bolt"></i></template>
					<template #label>Misskey® Fan-out Timeline Technology™ (FTT)</template>
					<template v-if="enableFanoutTimeline" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<MkSwitch v-model="enableFanoutTimeline">
							<template #label>{{ i18n.ts.enable }}</template>
							<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDescription }}</template>
						</MkSwitch>

						<MkSwitch v-model="enableFanoutTimelineDbFallback">
							<template #label>{{ i18n.ts._serverSettings.fanoutTimelineDbFallback }}</template>
							<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDbFallbackDescription }}</template>
						</MkSwitch>

						<MkInput v-model="perLocalUserUserTimelineCacheMax" type="number">
							<template #label>perLocalUserUserTimelineCacheMax</template>
						</MkInput>

						<MkInput v-model="perRemoteUserUserTimelineCacheMax" type="number">
							<template #label>perRemoteUserUserTimelineCacheMax</template>
						</MkInput>

						<MkInput v-model="perUserHomeTimelineCacheMax" type="number">
							<template #label>perUserHomeTimelineCacheMax</template>
						</MkInput>

						<MkInput v-model="perUserListTimelineCacheMax" type="number">
							<template #label>perUserListTimelineCacheMax</template>
						</MkInput>
					</div>
				</MkFolder>

				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-bolt"></i></template>
					<template #label>Misskey® Reactions Buffering Technology™ (RBT)<span class="_beta">{{ i18n.ts.beta }}</span></template>
					<template v-if="enableReactionsBuffering" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<MkSwitch v-model="enableReactionsBuffering">
							<template #label>{{ i18n.ts.enable }}</template>
							<template #caption>{{ i18n.ts._serverSettings.reactionsBufferingDescription }}</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';

const enableServerMachineStats = ref<boolean>(false);
const enableIdenticonGeneration = ref<boolean>(false);
const enableChartsForRemoteUser = ref<boolean>(false);
const enableChartsForFederatedInstances = ref<boolean>(false);
const enableFanoutTimeline = ref<boolean>(false);
const enableFanoutTimelineDbFallback = ref<boolean>(false);
const perLocalUserUserTimelineCacheMax = ref<number>(0);
const perRemoteUserUserTimelineCacheMax = ref<number>(0);
const perUserHomeTimelineCacheMax = ref<number>(0);
const perUserListTimelineCacheMax = ref<number>(0);
const enableReactionsBuffering = ref<boolean>(false);

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableServerMachineStats.value = meta.enableServerMachineStats;
	enableIdenticonGeneration.value = meta.enableIdenticonGeneration;
	enableChartsForRemoteUser.value = meta.enableChartsForRemoteUser;
	enableChartsForFederatedInstances.value = meta.enableChartsForFederatedInstances;
	enableFanoutTimeline.value = meta.enableFanoutTimeline;
	enableFanoutTimelineDbFallback.value = meta.enableFanoutTimelineDbFallback;
	perLocalUserUserTimelineCacheMax.value = meta.perLocalUserUserTimelineCacheMax;
	perRemoteUserUserTimelineCacheMax.value = meta.perRemoteUserUserTimelineCacheMax;
	perUserHomeTimelineCacheMax.value = meta.perUserHomeTimelineCacheMax;
	perUserListTimelineCacheMax.value = meta.perUserListTimelineCacheMax;
	enableReactionsBuffering.value = meta.enableReactionsBuffering;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats: enableServerMachineStats.value,
		enableIdenticonGeneration: enableIdenticonGeneration.value,
		enableChartsForRemoteUser: enableChartsForRemoteUser.value,
		enableChartsForFederatedInstances: enableChartsForFederatedInstances.value,
		enableFanoutTimeline: enableFanoutTimeline.value,
		enableFanoutTimelineDbFallback: enableFanoutTimelineDbFallback.value,
		perLocalUserUserTimelineCacheMax: perLocalUserUserTimelineCacheMax.value,
		perRemoteUserUserTimelineCacheMax: perRemoteUserUserTimelineCacheMax.value,
		perUserHomeTimelineCacheMax: perUserHomeTimelineCacheMax.value,
		perUserListTimelineCacheMax: perUserListTimelineCacheMax.value,
		enableReactionsBuffering: enableReactionsBuffering.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.other,
	icon: 'ti ti-adjustments',
}));
</script>
