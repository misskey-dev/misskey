<template>
<FormSuspense :p="init">
	<div class="_formRoot">
		<FormSwitch v-model="enableTwitterIntegration" class="_formBlock">
			<template #label>{{ i18n.ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableTwitterIntegration">
			<FormInfo class="_formBlock">Callback URL: {{ `${uri}/api/tw/cb` }}</FormInfo>
		
			<FormInput v-model="twitterConsumerKey" class="_formBlock">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Consumer Key</template>
			</FormInput>

			<FormInput v-model="twitterConsumerSecret" class="_formBlock">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>Consumer Secret</template>
			</FormInput>
		</template>

		<FormButton primary class="_formBlock" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</FormButton>
	</div>
</FormSuspense>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/MkButton.vue';
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
