<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="enableDiscordIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo>Callback URL: {{ `${url}/api/dc/cb` }}</FormInfo>
		
			<FormInput v-model="discordClientId">
				<template #prefix><i class="fas fa-key"></i></template>
				Client ID
			</FormInput>

			<FormInput v-model="discordClientSecret">
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
import FormSwitch from '@client/components/debobigego/switch.vue';
import FormInput from '@client/components/debobigego/input.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import FormSuspense from '@client/components/debobigego/suspense.vue';
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
