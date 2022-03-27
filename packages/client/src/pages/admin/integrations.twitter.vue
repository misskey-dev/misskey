<template>
<FormSuspense :p="init">
	<div class="_formRoot">
		<FormSwitch v-model="enableTwitterIntegration" class="_formBlock">
			<template #label>{{ $ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableTwitterIntegration">
			<FormInfo class="_formBlock">Callback URL: {{ `${uri}/api/tw/cb` }}</FormInfo>
		
			<FormInput v-model="twitterConsumerKey" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Consumer Key</template>
			</FormInput>

			<FormInput v-model="twitterConsumerSecret" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Consumer Secret</template>
			</FormInput>
		</template>

		<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</div>
</FormSuspense>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import FormInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormInfo,
		FormButton,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'Twitter',
				icon: 'fab fa-twitter'
			},
			enableTwitterIntegration: false,
			twitterConsumerKey: null,
			twitterConsumerSecret: null,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('admin/meta');
			this.uri = meta.uri;
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.twitterConsumerKey = meta.twitterConsumerKey;
			this.twitterConsumerSecret = meta.twitterConsumerSecret;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableTwitterIntegration: this.enableTwitterIntegration,
				twitterConsumerKey: this.twitterConsumerKey,
				twitterConsumerSecret: this.twitterConsumerSecret,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
