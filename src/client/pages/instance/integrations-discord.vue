<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="enableDiscordIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo>Callback URL: {{ `${url}/api/dc/cb` }}</FormInfo>
		
			<FormInput v-model:value="discordClientId">
				<template #prefix><i class="fas fa-key"></i></template>
				Client ID
			</FormInput>

			<FormInput v-model:value="discordClientSecret">
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
				title: 'Discord',
				icon: 'fab fa-discord'
			},
			enableDiscordIntegration: false,
			discordClientId: null,
			discordClientSecret: null,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
			this.discordClientId = meta.discordClientId;
			this.discordClientSecret = meta.discordClientSecret;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableDiscordIntegration: this.enableDiscordIntegration,
				discordClientId: this.discordClientId,
				discordClientSecret: this.discordClientSecret,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
