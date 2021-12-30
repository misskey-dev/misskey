<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="enableDiscordIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo>Callback URL: {{ `${uri}/api/dc/cb` }}</FormInfo>
		
			<FormInput v-model="discordClientId">
				<template #prefix><i class="fas fa-key"></i></template>
				Client ID
			</FormInput>

			<FormInput v-model="discordClientSecret">
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
			this.uri = meta.uri;
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
