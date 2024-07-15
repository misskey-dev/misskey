<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
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
				<MkInput v-model="DiscordWebhookUrlWordBlock" type="password">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>Discord Webhook Url WordBlock</template>
				</MkInput>
				<MkInput v-model="EmojiBotToken" type="password">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>EmojiBotToken</template>
				</MkInput>
				<MkInput v-model="ApiBase">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>ApiBase</template>
				</MkInput>
				<MkSwitch v-model="requestEmojiAllOk">
					絵文字の申請全部許可
				</MkSwitch>
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
import MkInput from '@/components/MkInput.vue';

const enableServerMachineStats = ref<boolean>(false);
const enableIdenticonGeneration = ref<boolean>(false);
const enableChartsForRemoteUser = ref<boolean>(false);
const enableChartsForFederatedInstances = ref<boolean>(false);
const requestEmojiAllOk = ref(false);
let DiscordWebhookUrl = ref(null);
let DiscordWebhookUrlWordBlock = ref(null);
let EmojiBotToken = ref(null);
let ApiBase = ref(null);

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableServerMachineStats.value = meta.enableServerMachineStats;
	enableIdenticonGeneration.value = meta.enableIdenticonGeneration;
	enableChartsForRemoteUser.value = meta.enableChartsForRemoteUser;
	enableChartsForFederatedInstances.value = meta.enableChartsForFederatedInstances;
	requestEmojiAllOk.value = meta.requestEmojiAllOk;
	DiscordWebhookUrl.value = meta.DiscordWebhookUrl;
	DiscordWebhookUrlWordBlock.value = meta.DiscordWebhookUrlWordBlock;
	EmojiBotToken.value = meta.EmojiBotToken;
	ApiBase.value = meta.ApiBase;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats: enableServerMachineStats.value,
		enableIdenticonGeneration: enableIdenticonGeneration.value,
		enableChartsForRemoteUser: enableChartsForRemoteUser.value,
		requestEmojiAllOk: requestEmojiAllOk.value,
		enableChartsForFederatedInstances: enableChartsForFederatedInstances.value,
		DiscordWebhookUrl: DiscordWebhookUrl.value,
		EmojiBotToken: EmojiBotToken.value,
		ApiBase: ApiBase.value,
		DiscordWebhookUrlWordBlock: DiscordWebhookUrlWordBlock.value,
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
