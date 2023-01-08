<template>
<FormSuspense :p="init">
	<div class="_gaps_m">
		<MkSwitch v-model="enableTwitterIntegration">
			<template #label>{{ i18n.ts.enable }}</template>
		</MkSwitch>

		<template v-if="enableTwitterIntegration">
			<FormInfo>Callback URL: {{ `${uri}/api/tw/cb` }}</FormInfo>
		
			<MkInput v-model="twitterConsumerKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Consumer Key</template>
			</MkInput>

			<MkInput v-model="twitterConsumerSecret">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Consumer Secret</template>
			</MkInput>
		</template>

		<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</FormSuspense>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

let uri: string = $ref('');
let enableTwitterIntegration: boolean = $ref(false);
let twitterConsumerKey: string | null = $ref(null);
let twitterConsumerSecret: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	uri = meta.uri;
	enableTwitterIntegration = meta.enableTwitterIntegration;
	twitterConsumerKey = meta.twitterConsumerKey;
	twitterConsumerSecret = meta.twitterConsumerSecret;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableTwitterIntegration,
		twitterConsumerKey,
		twitterConsumerSecret,
	}).then(() => {
		fetchInstance();
	});
}
</script>
