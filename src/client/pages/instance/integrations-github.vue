<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="enableGithubIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableGithubIntegration">
			<FormInfo>Callback URL: {{ `${url}/api/gh/cb` }}</FormInfo>
		
			<FormInput v-model:value="githubClientId">
				<template #prefix><i class="fas fa-key"></i></template>
				Client ID
			</FormInput>

			<FormInput v-model:value="githubClientSecret">
				<template #prefix><i class="fas fa-key"></i></template>
				Client Secret
			</FormInput>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormBase,
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

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
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
