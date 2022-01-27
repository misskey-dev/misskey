<template>
<div>
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormRadios v-model="provider" class="_formBlock">
				<option :value="null">{{ $ts.none }} ({{ $ts.notRecommended }})</option>
				<option value="hcaptcha">hCaptcha</option>
				<option value="recaptcha">reCAPTCHA</option>
			</FormRadios>

			<template v-if="provider === 'hcaptcha'">
				<FormInput v-model="hcaptchaSiteKey" class="_formBlock">
					<template #prefix><i class="fas fa-key"></i></template>
					<template #label>{{ $ts.hcaptchaSiteKey }}</template>
				</FormInput>
				<FormInput v-model="hcaptchaSecretKey" class="_formBlock">
					<template #prefix><i class="fas fa-key"></i></template>
					<template #label>{{ $ts.hcaptchaSecretKey }}</template>
				</FormInput>
				<FormSlot class="_formBlock">
					<template #label>{{ $ts.preview }}</template>
					<MkCaptcha provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'recaptcha'">
				<FormInput v-model="recaptchaSiteKey" class="_formBlock">
					<template #prefix><i class="fas fa-key"></i></template>
					<template #label>{{ $ts.recaptchaSiteKey }}</template>
				</FormInput>
				<FormInput v-model="recaptchaSecretKey" class="_formBlock">
					<template #prefix><i class="fas fa-key"></i></template>
					<template #label>{{ $ts.recaptchaSecretKey }}</template>
				</FormInput>
				<FormSlot v-if="recaptchaSiteKey" class="_formBlock">
					<template #label>{{ $ts.preview }}</template>
					<MkCaptcha provider="recaptcha" :sitekey="recaptchaSiteKey"/>
				</FormSlot>
			</template>

			<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormRadios from '@/components/form/radios.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormRadios,
		FormInput,
		FormButton,
		FormSuspense,
		FormSlot,
		MkCaptcha: defineAsyncComponent(() => import('@/components/captcha.vue')),
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.botProtection,
				icon: 'fas fa-shield-alt'
			},
			provider: null,
			enableHcaptcha: false,
			hcaptchaSiteKey: null,
			hcaptchaSecretKey: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableHcaptcha = meta.enableHcaptcha;
			this.hcaptchaSiteKey = meta.hcaptchaSiteKey;
			this.hcaptchaSecretKey = meta.hcaptchaSecretKey;
			this.enableRecaptcha = meta.enableRecaptcha;
			this.recaptchaSiteKey = meta.recaptchaSiteKey;
			this.recaptchaSecretKey = meta.recaptchaSecretKey;

			this.provider = this.enableHcaptcha ? 'hcaptcha' : this.enableRecaptcha ? 'recaptcha' : null;

			this.$watch(() => this.provider, () => {
				this.enableHcaptcha = this.provider === 'hcaptcha';
				this.enableRecaptcha = this.provider === 'recaptcha';
			});
		},
	
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableHcaptcha: this.enableHcaptcha,
				hcaptchaSiteKey: this.hcaptchaSiteKey,
				hcaptchaSecretKey: this.hcaptchaSecretKey,
				enableRecaptcha: this.enableRecaptcha,
				recaptchaSiteKey: this.recaptchaSiteKey,
				recaptchaSecretKey: this.recaptchaSecretKey,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
