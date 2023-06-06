<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div class="_gaps_s">
				<MkSwitch v-model="enableChartsForRemoteUser">
					<template #label>{{ i18n.ts.enableChartsForRemoteUser }}</template>
				</MkSwitch>

				<MkSwitch v-model="enableChartsForFederatedInstances">
					<template #label>{{ i18n.ts.enableChartsForFederatedInstances }}</template>
				</MkSwitch>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkSwitch from '@/components/MkSwitch.vue';

let enableChartsForRemoteUser: boolean = $ref(false);
let enableChartsForFederatedInstances: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	enableChartsForRemoteUser = meta.enableChartsForRemoteUser;
	enableChartsForFederatedInstances = meta.enableChartsForFederatedInstances;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForRemoteUser,
		enableChartsForFederatedInstances,
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
