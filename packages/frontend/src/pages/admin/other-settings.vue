<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
                <MkInput v-model="DiscordWebhookUrl" type="password">
                    <template #prefix><i class="ti ti-key"></i></template>
                    <template #label>Discord Webhook URL</template>
                </MkInput>
                <MkInput v-model="EmojiBotToken" type="password">
                    <template #prefix><i class="ti ti-key"></i></template>
                    <template #label>EmojiBotToken</template>
                </MkInput>
                <MkInput v-model="ApiBase">
                    <template #prefix><i class="ti ti-key"></i></template>
                    <template #label>ApiBase</template>
                </MkInput>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from "@/components/MkInput.vue";

let enableServerMachineStats: boolean = $ref(false);
let enableIdenticonGeneration: boolean = $ref(false);
let enableChartsForRemoteUser: boolean = $ref(false);
let enableChartsForFederatedInstances: boolean = $ref(false);
let DiscordWebhookUrl: string | null = $ref(null);
let EmojiBotToken: string | null = $ref(null);
let ApiBase:string | null = $ref(null)
async function init() {
	const meta = await os.api('admin/meta');
	enableServerMachineStats = meta.enableServerMachineStats;
	enableIdenticonGeneration = meta.enableIdenticonGeneration;
	enableChartsForRemoteUser = meta.enableChartsForRemoteUser;
	enableChartsForFederatedInstances = meta.enableChartsForFederatedInstances;
    DiscordWebhookUrl = meta.DiscordWebhookUrl;
    EmojiBotToken = meta.EmojiBotToken;
    ApiBase = meta.ApiBase;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats,
		enableIdenticonGeneration,
		enableChartsForRemoteUser,
		enableChartsForFederatedInstances,
        DiscordWebhookUrl,
        EmojiBotToken,
        ApiBase
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.other,
	icon: 'ti ti-adjustments',
});
</script>
