<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormSwitch v-model="enableEmail" class="_formBlock">
				<template #label>{{ $ts.enableEmail }}</template>
				<template #caption>{{ $ts.emailConfigInfo }}</template>
			</FormSwitch>

			<template v-if="enableEmail">
				<FormInput v-model="email" type="email" class="_formBlock">
					<template #label>{{ $ts.emailAddress }}</template>
				</FormInput>

				<FormSection>
					<template #label>{{ $ts.smtpConfig }}</template>
					<FormSplit :min-width="280">
						<FormInput v-model="smtpHost" class="_formBlock">
							<template #label>{{ $ts.smtpHost }}</template>
						</FormInput>
						<FormInput v-model="smtpPort" type="number" class="_formBlock">
							<template #label>{{ $ts.smtpPort }}</template>
						</FormInput>
					</FormSplit>
					<FormSplit :min-width="280">
						<FormInput v-model="smtpUser" class="_formBlock">
							<template #label>{{ $ts.smtpUser }}</template>
						</FormInput>
						<FormInput v-model="smtpPass" type="password" class="_formBlock">
							<template #label>{{ $ts.smtpPass }}</template>
						</FormInput>
					</FormSplit>
					<FormInfo class="_formBlock">{{ $ts.emptyToDisableSmtpAuth }}</FormInfo>
					<FormSwitch v-model="smtpSecure" class="_formBlock">
						<template #label>{{ $ts.smtpSecure }}</template>
						<template #caption>{{ $ts.smtpSecureInfo }}</template>
					</FormSwitch>
				</FormSection>
			</template>
		</div>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormSplit,
		FormSection,
		FormInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.emailServer,
				icon: 'fas fa-envelope',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					text: this.$ts.testEmail,
					handler: this.testEmail,
				}, {
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
			enableEmail: false,
			email: null,
			smtpSecure: false,
			smtpHost: '',
			smtpPort: 0,
			smtpUser: '',
			smtpPass: '',
		}
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableEmail = meta.enableEmail;
			this.email = meta.email;
			this.smtpSecure = meta.smtpSecure;
			this.smtpHost = meta.smtpHost;
			this.smtpPort = meta.smtpPort;
			this.smtpUser = meta.smtpUser;
			this.smtpPass = meta.smtpPass;
		},

		async testEmail() {
			const { canceled, result: destination } = await os.inputText({
				title: this.$ts.destination,
				type: 'email',
				placeholder: this.$instance.maintainerEmail
			});
			if (canceled) return;
			os.apiWithDialog('admin/send-email', {
				to: destination,
				subject: 'Test email',
				text: 'Yo'
			});
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				enableEmail: this.enableEmail,
				email: this.email,
				smtpSecure: this.smtpSecure,
				smtpHost: this.smtpHost,
				smtpPort: this.smtpPort,
				smtpUser: this.smtpUser,
				smtpPass: this.smtpPass,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
