<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="enableGithubIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableGithubIntegration">
			<FormInfo>Callback URL: {{ `${uri}/api/gh/cb` }}</FormInfo>
		
			<FormInput v-model="githubClientId">
				<template #prefix><i class="fas fa-key"></i></template>
				Client ID
			</FormInput>

			<FormInput v-model="githubClientSecret">
				<template #prefix><i class="fas fa-key"></i></template>
				Client Secret
			</FormInput>
		</template>

		<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

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
