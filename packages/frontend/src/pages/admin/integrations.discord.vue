<template>
<FormSuspense :p="init">
	<div class="_gaps_m">
		<MkSwitch v-model="enableDiscordIntegration">
			<template #label>{{ i18n.ts.enable }}</template>
		</MkSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo>Callback URL: {{ `${uri}/api/dc/cb` }}</FormInfo>
		
			<MkInput v-model="discordClientId">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client ID</template>
			</MkInput>

			<MkInput v-model="discordClientSecret">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Client Secret</template>
			</MkInput>
		</template>

		<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</FormSuspense>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
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
