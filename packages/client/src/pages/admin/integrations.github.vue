<template>
<FormSuspense :p="init">
	<div class="_formRoot">
		<FormSwitch v-model="enableGithubIntegration" class="_formBlock">
			<template #label>{{ $ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableGithubIntegration">
			<FormInfo class="_formBlock">Callback URL: {{ `${uri}/api/gh/cb` }}</FormInfo>
		
			<FormInput v-model="githubClientId" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Client ID</template>
			</FormInput>

			<FormInput v-model="githubClientSecret" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Client Secret</template>
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
				title: 'GitHub',
				icon: 'fab fa-github'
			},
			enableGithubIntegration: false,
			githubClientId: null,
			githubClientSecret: null,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('admin/meta');
			this.uri = meta.uri;
			this.enableGithubIntegration = meta.enableGithubIntegration;
			this.githubClientId = meta.githubClientId;
			this.githubClientSecret = meta.githubClientSecret;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableGithubIntegration: this.enableGithubIntegration,
				githubClientId: this.githubClientId,
				githubClientSecret: this.githubClientSecret,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
