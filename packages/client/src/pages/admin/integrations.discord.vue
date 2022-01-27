<template>
<FormSuspense :p="init">
	<div class="_formRoot">
		<FormSwitch v-model="enableDiscordIntegration" class="_formBlock">
			<template #label>{{ $ts.enable }}</template>
		</FormSwitch>

		<template v-if="enableDiscordIntegration">
			<FormInfo class="_formBlock">Callback URL: {{ `${uri}/api/dc/cb` }}</FormInfo>
		
			<FormInput v-model="discordClientId" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Client ID</template>
			</FormInput>

			<FormInput v-model="discordClientSecret" class="_formBlock">
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
				title: 'Discord',
				icon: 'fab fa-discord'
			},
			enableDiscordIntegration: false,
			discordClientId: null,
			discordClientSecret: null,
		}
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
