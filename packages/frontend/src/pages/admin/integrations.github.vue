<template>
<FormSuspense :p="init">
	<div class="_gaps_m">
		<FormSwitch v-model="enableGithubIntegration">
			<template #label>{{ i18n.ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableGithubIntegration">
			<FormInfo>Callback URL: {{ `${uri}/api/gh/cb` }}</FormInfo>
		
			<FormInput v-model="githubClientId">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client ID</template>
			</FormInput>

			<FormInput v-model="githubClientSecret">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client Secret</template>
			</FormInput>
		</template>

		<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</FormSuspense>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import MkButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

let uri: string = $ref('');
let enableGithubIntegration: boolean = $ref(false);
let githubClientId: string | null = $ref(null);
let githubClientSecret: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	uri = meta.uri;
	enableGithubIntegration = meta.enableGithubIntegration;
	githubClientId = meta.githubClientId;
	githubClientSecret = meta.githubClientSecret;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableGithubIntegration,
		githubClientId,
		githubClientSecret,
	}).then(() => {
		fetchInstance();
	});
}
</script>
