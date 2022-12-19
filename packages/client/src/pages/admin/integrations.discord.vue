<template>
<FormSuspense :p="init">
	<div class="_formRoot">
		<FormSwitch v-model="enableDiscordIntegration" class="_formBlock">
			<template #label>{{ i18n.ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo class="_formBlock">Callback URL: {{ `${uri}/api/dc/cb` }}</FormInfo>
		
			<FormInput v-model="discordClientId" class="_formBlock">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client ID</template>
			</FormInput>

			<FormInput v-model="discordClientSecret" class="_formBlock">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client Secret</template>
			</FormInput>
		</template>

		<FormButton primary class="_formBlock" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</FormButton>
	</div>
</FormSuspense>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

let uri: string = $ref('');
let enableDiscordIntegration: boolean = $ref(false);
let discordClientId: string | null = $ref(null);
let discordClientSecret: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	uri = meta.uri;
	enableDiscordIntegration = meta.enableDiscordIntegration;
	discordClientId = meta.discordClientId;
	discordClientSecret = meta.discordClientSecret;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableDiscordIntegration,
		discordClientId,
		discordClientSecret,
	}).then(() => {
		fetchInstance();
	});
}
</script>
